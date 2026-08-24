async function chunkMessages(messages) {
    const chunks = []
    for (let i = 0; i < messages.length; i+= 500) {
        const chunk = messages.slice(i, i+ 500)
        chunks.push(chunk)
    }
    return chunks
}

async function sendChunk(chunk) {
    const res = await fetch('https://api.postmarkapp.com/email/batch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Postmark-Server-Token': process.env.POSTMARK_API_KEY,
        },
        body: JSON.stringify(chunk)
    });

    if (!res.ok) {
        throw new Error(`Postmark batch request failed with status ${res.status}`);
    }

    return res.json();
}

async function sendEmail(recipients, courseInfo) {
    const messages = []
    let slotType
    if (courseInfo.seats) slotType = 'Seat'
    if (courseInfo.waitlist) slotType = 'Waitlist'

    if (recipients.length === 0) {
        console.log(`No Recipients for ${courseInfo.course}`)
        return
    }

    recipients.forEach(recipient => {
        messages.push({
            From: 'tgrew803@mtroyal.ca', // replace with real email
            To: recipient.email,
            Subject: `${slotType} Available for ${courseInfo.course}`,
            HtmlBody: 'build body later using courseInfo',
            MessageStream: 'outbound'
        })
    });

    const chunks = await chunkMessages(messages)

    const settled = await Promise.allSettled(chunks.map(chunk => sendChunk(chunk)));

    let sentCount = 0
    let failedCount = 0
    const failedMessages = []
    let requestFailures = 0

    settled.forEach((outcome, chunkIndex) => {
        if (outcome.status === 'rejected') {
            console.log(`Chunk ${chunkIndex} failed entirely:`, outcome.reason);
            requestFailures++
            failedCount += chunks[chunkIndex].length
            return
        }

        const results = outcome.value // array of per-message results
        results.forEach(result => {
            if (result.ErrorCode !== 0) {
                console.log(result.ErrorCode)
                failedCount++
                failedMessages.push(result)
                // log error somewhere so it can be retried
            } else {
                sentCount++
            }
        })
    });

    return {
        success: requestFailures === 0 && failedCount === 0,
        totalRecipients: recipients.length,
        sent: sentCount,
        failed: failedCount,
        requestFailures,
        failedMessages
    }
}


module.exports ={ sendEmail }