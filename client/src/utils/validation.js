export const MRU_DOMAIN= ['@mtroyal.ca']

let mailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
let numRegex = /^\d{4}$/;

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

    if ('subject' in fields) {
        if (!fields.subject) {
            errors.subject = 'Select a course'
        }
    }

    if ('courseNum' in fields) {
        if (!(numRegex.test(fields.courseNum))) {
            errors.courseNum = 'Invalid Course Number'
        }
    }

    if ('term' in fields) {
        if (!fields.term) {
            errors.term = 'Select a term'
        }
    }

    if ('password' in fields) {
        if (!fields.password) {
            errors.password = 'Password is required'
        }
    }

    if ('confirmPassword' in fields) {
        if (!fields.confirmPassword) {
            errors.confirmPassword = 'Confirm Password is required'
        }

        if (fields.password !== fields.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match'
        }
    }
    
    return errors;
}