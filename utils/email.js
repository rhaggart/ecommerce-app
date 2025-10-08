const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

exports.sendOrderConfirmation = async (order) => {
    try {
        const itemsList = order.items.map(item => 
            `${item.name} - Quantity: ${item.quantity} - $${item.price.toFixed(2)}`
        ).join('\n');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: order.customerEmail,
            subject: `Order Confirmation - ${order.orderNumber}`,
            text: `
Dear ${order.customerName},

Thank you for your order!

Order Number: ${order.orderNumber}
Order Date: ${order.createdAt.toLocaleDateString()}

Items:
${itemsList}

Total: $${order.totalAmount.toFixed(2)}

Shipping Address:
${order.shippingAddress.street}
${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
${order.shippingAddress.country}

Your order is being processed and will be shipped soon.

Thank you for shopping with us!
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Order confirmation email sent');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};