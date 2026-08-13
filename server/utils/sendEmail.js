async function chunkMessages(messages) {
    const chunks = []
    for (let i = 0; i < messages.length; i+= 500) {
        const chunk = messages.slice(i, i+ 500)
        chunks.push(chunk)
    }
    return chunks
}

async function sendEmail(recipients, courseInfo) {
    const messages = []
    const responses = []
    let slotType

    if (recipients.length === 0) {
        console.log(`No Recipients for ${courseInfo.Subject} ${courseInfo.courseNum}`)
        return
    }
    recipients.forEach(recipient => {
        if (courseInfo.seat) {
            slotType = 'Seat'
        }
        if (courseInfo.waitlist) {
            slotType = 'Waitlist'
        }
        messages.push({
            From: 'tgrew803@mtroyal.ca', // replace with real email
            To: recipient, 
            // slotType = Seat or waitlist 
            Subject: `${slotType} Available for ${courseInfo.Subject} ${courseInfo.courseNum}`,
            HtmlBody: 'build body later using courseInfo',
            MessageStream: 'outbound'
        })
    });

    const chunks = await chunkMessages(messages)

    for (let i = 0; i < chunks.length; i++){
        const chunk = chunks[i]
        console.log('Sending batch: ', JSON.stringify(chunk, null, 2));
        const res = await fetch('https://api.postmarkapp.com/email/batch',{ 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Postmark-Server-Token': process.env.POSTMARK_API_KEY,
            },
            body: JSON.stringify(chunk)
        });
        if (res.ok) {
            const result = await res.json();
            responses.push(result)
        }
        else {
            return {
                // return summary object
            }
        }

    }

    for (let i = 0; i < responses.length; i++) {
        for (let j = 0; j < responses[i].length; j++) {
            const result = responses[i][j]
            if (result.ErrorCode != 0) {
                console.log(result.ErrorCode)
                // log error somewhere so it can be retried
            }
        }
    }
}

module.exports ={ sendEmail }