try {
    const kb = require('./models/KnowledgeBase');
    console.log('Backend root require success', kb);
} catch (e) {
    console.error('Backend root require failed', e);
}

try {
    const route = require('./routes/simulate');
    console.log('Route require success');
} catch (e) {
    console.error('Route require failed', e);
}
