const supabaseAnon = require('../utils/anonClient')

function extractBearerToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }
    return authHeader.split(' ')[1];
}

async function requireAuth(req, res, next) {
    const token = extractBearerToken(req)

    if (!token) {
        return res.status(401).json ({ message: 'Token not provided'})
    }

    try {
        const {data, error} = await supabaseAnon.auth.getUser(token);

        if (error || !data.user) {
            console.log(error)
            return res.status(401).json({ message: 'Invalid or expired token'})
        }

        req.user = { id: data.user.id }
        next();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Auth Check Failed'})
    }
}

module.exports = requireAuth