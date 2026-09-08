function createUpiPaymentLink(upiId, name, amount) {
    if (!upiId) {
        throw new Error('createUpiPaymentLink: upiId is required');
    }

    if (!name) {
        throw new Error('createUpiPaymentLink: name is required');
    }

    if (amount === undefined || amount === null || amount <= 0) {
        throw new Error('createUpiPaymentLink: amount must be greater than 0');
    }

    const params = new URLSearchParams({
        pa: upiId,
        pn: name,
        am: Number(amount).toFixed(2),
        cu: 'INR'
    });

    return `upi://pay?${params.toString()}`;
}

module.exports = {
    createUpiPaymentLink
};