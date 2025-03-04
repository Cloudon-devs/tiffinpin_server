const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function formatOrderDetails(order) {
  const meals = order?.meals
    .map((meal) => `- ${meal.quantity}x ${meal.meal.name || 'Meal'}`)
    .join('\n');

  const dishes = order?.dishes
    .map(
      (dish) =>
        `- ${dish.quantity}x ${dish.dish.name || 'Dish'} (${dish.sub_category})`,
    )
    .join('\n');

  return `
        Order ID: ${order?._id}
        Customer: ${order?.user.name || order?.user.mobile}
        Payment Method: ${order?.payment_method}
        Amount: ₹${order?.amount}
        
        Meals:
        ${meals}
        
        Dishes:
        ${dishes}
        
        Delivery Address:
        ${order?.address.address_line1}
        ${order?.address.address_line2 || ''}
        ${order?.address.city}, ${order?.address.state}
        ${order?.address.pincode}
        
        Order Status: ${order?.status}
        Created At: ${new Date(order?.createdAt).toLocaleString()}
      `;
}

exports.sendOrderNotificationEmail = async (order) => {
  try {
    const formattedDate = new Date(order?.createdAt).toLocaleString();

    console.log('Order:', order);

    // Stylish HTML template
    const htmlTemplate = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 25px; border-radius: 10px; background: #f7f7f7;">
        <div style="background: #2b2d3a; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <img src="https://www.tiffinpin.com/drawables/site_logo_small.png" 
       alt="TiffinPin Logo" 
       style="height: 50px; width: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">

        <h1 style="color: #fff; margin: 0; font-size: 24px;">🎉 New Order Alert!</h1>
        </div>

        <div style="padding: 25px; background: white; border-radius: 0 0 10px 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <h2 style="color: #2b2d3a; margin: 0 0 5px 0;">Order #${order?._id}</h2>
              <p style="color: #666; margin: 0;">${formattedDate}</p>
            </div>
            <div style="background: #e8f5e9; padding: 10px 15px; border-radius: 8px; align-self: center; margin-top: 16px;">
            <span style="color:rgb(39, 84, 41); font-weight: bold;">Price: </span>  
            
            <span style="color: #4caf50; font-weight: bold;">₹${order?.amount.toFixed(2)}</span>
            </div>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #2b2d3a; margin: 0 0 15px 0;">📦 Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${order?.meals
                ?.map(
                  (item) => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px 0;">${item.name} x${item.quantity}</td>
                </tr>
              `,
                )
                ?.join('')}
            </table>
          </div>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #2b2d3a; margin: 0 0 10px 0;">👤 Customer Info</h3>
            <p style="margin: 5px 0;">📍 ${order?.address?.reciever_name}</p>
            <p style="margin: 5px 0;">📞 ${order?.address?.reciever_mobile}</p>
          </div>

          <a href="https://www.tiffinpin.com/seller/orders" 
             style="display: inline-block; width: 92%; background: #4caf50; color: white; 
                    text-align: center; padding: 15px; border-radius: 8px; text-decoration: none; 
                    font-weight: bold; margin-top: 20px;">
            👉 View Full Order in Dashboard
          </a>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>Need help? Contact support@yourcompany.com</p>
          <div style="margin-top: 15px;">
            <a href="#" style="margin: 0 10px;"><img src="https://tiffinpin.com/facebook-icon.png" width="20"></a>
            <a href="#" style="margin: 0 10px;"><img src="https://tiffinpin.com/twitter-icon.png" width="20"></a>
          </div>
        </div>
      </div>
    `;

    // Fallback text version
    const textTemplate = `
      NEW ORDER RECEIVED (#${order?._id})
      ====================================
      📅 Date: ${formattedDate}
      💰 Total: ₹${order?.amount?.toFixed(2)}
      
      ITEMS:
      ${order?.items?.map((item) => `- ${item.name} x${item.quantity} ($${item?.price?.toFixed(2)})`)?.join('\n')}
      
      CUSTOMER INFO:
      👤 Name: ${order?.address?.reciever_name}
      📞 Phone: ${order?.customer?.reciever_mobile}
      
      View full order: ${'www.tiffinpin.com'}/orders/${order?._id}
    `;

    await transporter.sendMail({
      from: `"Order Notifications" <${process.env.EMAIL_USERNAME}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🚀 New Order! #${order?._id} - ₹${order?.amount.toFixed(2)}`,
      text: textTemplate,
      html: htmlTemplate,
    });

    console.log('📬 Order notification email sent successfully!');
  } catch (error) {
    console.error('❌ Error sending order notification email:', error);
  }
};
