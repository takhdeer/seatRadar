export const MRU_DOMAIN= ['@mtroyal.ca']

let mailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
let crnRegex = /^\d{5}$/;

export const validateEmail = (email, requireMRU) => {
    if (!email) return 'Email is requried'
    const syntaxvalid = mailRegex.test(email)
    if (!syntaxvalid) return 'Email syntax is not valid'
    if (requireMRU) {
        const hasMRUDomain = MRU_DOMAIN.some(d => email.endsWith(d))
        if (!hasMRUDomain) return 'Must be a MRU Email (@mtroyal.ca)'
    }
    return null;
}

export const validateForm = (fields) => {
    const errors = {};
    if ('email' in fields) {
        const emailErr = validateEmail(fields.email, fields.requireMRU);
        if (emailErr) errors.email = emailErr;
    }

    if ('crn' in fields) {
        if (!fields.crn) {
            errors.crn = 'CRN is required'
        } else if (!crnRegex.test(fields.crn)) {
            errors.crn = 'Incorrect CRN'
        }
    }

    if ('term' in fields) {
        if (!fields.term) {
            errors.term = 'Incorrect term'
        }
    }

    return errors;
}