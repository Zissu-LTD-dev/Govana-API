const axios = require("axios");

class MinisoftDocumentController {
  constructor() {
    // Use the base URL from the environment variable
    const baseUrl =
      process.env.MINISOFT_API_URL ||
      "https://w.minisoft.co.il/CodeBina.svc/GetRest";
    // Append the correct endpoint for document creation
    this.apiUrl = `${baseUrl}/DocumentRest/CreateDocument`;
  }

  createDocument(shopifyOrder) {
    console.log(
      `Transforming order: ${shopifyOrder.id}, Total: ${shopifyOrder.total_price} ${shopifyOrder.currency}`
    );

    const minisoftPayload = {
      Main: {
        DocType: 100,
        CustomerNo: 5001,
        Price: parseFloat(shopifyOrder.current_total_price),
        PriceBeforeVat: parseFloat(
          this.calculatePriceBeforeVat(shopifyOrder.subtotal_price)
        ),
        Currency: {
          Type: this.getCurrencyType(shopifyOrder.currency),
        },
      },
      Details: shopifyOrder.line_items.map((item) => ({
        ItemNo: item.id.toString(),
        ItemName: item.title,
        Amount: item.quantity,
        PriceUnit: parseFloat(item.price),
        Price: parseFloat(item.price),
        Currency: {
          Type: this.getCurrencyType(shopifyOrder.currency),
        },
      })),
    };

    return minisoftPayload;
  }

  calculatePriceBeforeVat(order) {
    return parseFloat(order.total_price) / 1.17; // Assuming 17% VAT
  }

  getCurrencyType(currency) {
    const currencyMap = {
      ILS: 1,
      USD: 2,
    };
    return currencyMap[currency] || 1;
  }
}

module.exports = new MinisoftDocumentController();
