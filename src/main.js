/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const discount = 1 - (purchase.discount / 100);
    return purchase.sale_price * purchase.quantity * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    if (index === 0){
        return seller.profit * 0.15;
    } else if (index === 1 || index === 2) {
      return seller.profit * 0.10;
    } else if (index === total - 1) {
      return 0;
    } else {
      return seller.profit * 0.05;
    }
    

}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if(!data 
      || !Array.isArray(data.sellers) 
      || !Array.isArray(data.purchase_records) 
      || !Array.isArray(data.products) 
      || data.sellers.length === 0 
      || data.purchase_records.length === 0 
      || data.products === 0
    ) {
      throw  new Error('Некорректные входные данные')
    }
    // @TODO: Проверка наличия опций
     const { calculateRevenue, calculateBonus } = options;
    if(!calculateRevenue || !calculateBonus ) {
      throw new Error('Не переданы необходимые функции в опциях')
    }
      

    // @TODO: Подготовка промежуточных данных для сбора статистики
     const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(
    sellerStats.map((item) => [item.seller_id, item])
    );

    const productIndex = Object.fromEntries(
    data.products.map((item) => [item.sku, item])
  );


    // @TODO: Расчет выручки и прибыли для каждого продавца
     data.purchase_records.forEach((record) => {
    // Чек
    const seller = sellerIndex[record.seller_id]; // Продавец
    // Увеличить количество продаж
    seller.sales_count++;
    // Увеличить общую сумму всех продаж
    seller.revenue += record.total_amount;

    // Расчёт прибыли для каждого товара
    record.items.forEach((item) => {
      const product = productIndex[item.sku]; // Товар
      // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
      const primeCost = product.purchase_price * item.quantity;
      product.primeCost = primeCost;

      // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
      let calculateRevenue = calculateSimpleRevenue(item);

      // Посчитать прибыль: выручка минус себестоимость
      let profit = calculateRevenue - primeCost;

      // Увеличить общую накопленную прибыль (profit) у продавца
      seller.profit += profit;

      // Учёт количества проданных товаров
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      // По артикулу товара увеличить его проданное количество у продавца
      seller.products_sold[item.sku] += item.quantity;
    });
  });

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index, array) => {
    seller.bonus = calculateBonusByProfit(index, array.length, seller); 
    seller.top_products = Object.entries(seller.products_sold)
      .map(([key, value]) => ({ sku: key, quantity: value }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10); 
  });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map((seller) => ({
    seller_id: seller.seller_id,
    name: seller.name, 
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2), 
    sales_count: seller.sales_count, 
    top_products: seller.top_products, 
    bonus: +seller.bonus.toFixed(2), 
  }));
}

