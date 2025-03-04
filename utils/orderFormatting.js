module.exports = function formatOrderDetails(order) {
  const meals = order.meals
    .map((meal) => `- ${meal.quantity}x ${meal.meal.name || 'Meal'}`)
    .join('\n');

  const dishes = order.dishes
    .map(
      (dish) =>
        `- ${dish.quantity}x ${dish.dish.name || 'Dish'} (${dish.sub_category})`,
    )
    .join('\n');

  return `
        Order ID: ${order._id}
        Customer: ${order.user.name || order.user.mobile}
        Payment Method: ${order.payment_method}
        Amount: ₹${order.amount}
        
        Meals:
        ${meals}
        
        Dishes:
        ${dishes}
        
        Delivery Address:
        ${order.address.address_line1}
        ${order.address.address_line2 || ''}
        ${order.address.city}, ${order.address.state}
        ${order.address.pincode}
        
        Order Status: ${order.status}
        Created At: ${new Date(order.createdAt).toLocaleString()}
      `;
};
