export const MRU_DOMAIN= ['@mtroyal.ca']

let mailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
let crnRegex = /^\d{5}$/;

export const validateEmail = (email) => {
    if (!email) return 'Email is requried'
    const syntaxvalid = mailRegex.test(email)
    if (!syntaxvalid) return 'Email syntax is not valid'
    const hasMRUDomain = MRU_DOMAIN.some(d => email.endsWith(d))
    if (!hasMRUDomain) return 'Must be a MRU Email (@mtroyal.ca)'
    return null;
}

export const validateForm = (fields) => {
    const errors = {};
    if ('email' in fields) {
        const emailErr = validateEmail(fields.email);
        if (emailErr) errors.email = emailErr;
    }
    if (!fields.crn) {
        errors.crn = 'CRN is required'
    } else if (!crnRegex.test(crn)) {
        errors.crn = 'Incorrect CRN'
    }
    if (!fields.term) {
        errors.term = 'Incorrect term'
    }

    return errors;
}