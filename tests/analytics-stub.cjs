module.exports = { default: new Proxy({}, {get: (_target, key) => key === 'providerId' ? value => value : () => {}}), analyticsError: () => 'other' };
