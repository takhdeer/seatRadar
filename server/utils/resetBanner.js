async function resetBanner(cookies) {
    const url = 'https://ban9ssb-prod.mtroyal.ca/StudentRegistrationSsb/ssb/classSearch/resetDataForm'

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Cookie': `JSESSIONID=${cookies[0]}; MRUB9SSBPRODREGHA=${cookies[1]}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://ban9ssb-prod.mtroyal.ca/StudentRegistrationSsb/ssb/classSearch/classSearch',
        },
    });

    const isTrue = await res.json()

    if(isTrue === true) {
        return true
    }
    else {
        return false
    }
}

module.exports = { resetBanner }