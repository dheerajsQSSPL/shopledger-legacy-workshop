const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

test('invoice figures match billed HSN-slab pricing after percent coupon', function () {
  const items = [
    { id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 100, qty: 10 }
  ];

  const billed = pricing.computeTotals(items, 'SAVE10');
  const invoiceFigures = invoice.computeInvoiceFigures({
    items: items,
    coupon: 'SAVE10',
    total: billed.total
  });

  assert.deepEqual(
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax, total: billed.total },
    { subtotal: 1000, discount: 100, tax: 45, total: 945 }
  );
  assert.deepEqual(
    {
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      rowGstPercent: invoiceFigures.rows[0].gstPercent,
      rowTax: invoiceFigures.rows[0].lineTax
    },
    {
      subtotal: billed.subtotal,
      discount: billed.discount,
      tax: billed.tax,
      cgst: billed.cgst,
      sgst: billed.sgst,
      total: billed.total,
      rowGstPercent: 5,
      rowTax: 45
    }
  );

  const html = invoice.render({ items: items, coupon: 'SAVE10', total: billed.total, id: 7 });
  assert.match(html, /Invoice Total<\/td><td class="r">₹945\.00/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});

test('invoice figures match billed item GST after flat coupon', function () {
  const items = [
    { id: 2, name: 'Ghee', sku: 'GHEE-1', hsn: '0405', gstRate: 12, price: 100, qty: 10 }
  ];

  const billed = pricing.computeTotals(items, 'FLAT50');
  const invoiceFigures = invoice.computeInvoiceFigures({
    items: items,
    coupon: 'FLAT50',
    total: billed.total
  });

  assert.deepEqual(
    { tax: billed.tax, total: billed.total },
    { tax: 114, total: 1064 }
  );
  assert.deepEqual(
    { tax: invoiceFigures.tax, discount: invoiceFigures.discount, total: invoiceFigures.total, gstPercent: invoiceFigures.rows[0].gstPercent },
    { tax: billed.tax, discount: billed.discount, total: billed.total, gstPercent: 12 }
  );
});
