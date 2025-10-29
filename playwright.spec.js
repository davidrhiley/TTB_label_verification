const { test, expect } = require('@playwright/test');

// Test images in the test-files directory
const testImages = [
  {
    file: 'brand-label-ABC.jpg',
    good: {
      brandName: 'ABC',
      productClass: 'STRAIGHT RYE WHISKY',
      alcoholContent: '45%',
      netContents: '750 ML',
      manufacturerName: 'ABC DISTILLERY',
      manufacturerAddress: 'FREDERICK, MD'
    }
  },
  {
    file: 'malt-beverage-alcohol-content-1.png',
    good: {
      brandName: 'Honey Huckleberry Pie',
      productClass: 'ALE',
      alcoholContent: '5%',
      netContents: '1 PINT',
      manufacturerName: 'Malt & Hop',
      manufacturerAddress: 'Hyattsville, MD'
    }
  },
  {
    file: 'malt-beverage-alcohol-content-4.png',
    good: {
      brandName: 'HOPTASTIC',
      productClass: 'PALE ALE',
      alcoholContent: '5%',
      netContents: '1 PINT',
      manufacturerName: 'Malt & Hop',
      manufacturerAddress: 'Hyattsville, MD'
    }
  },
  {
    file: 'r1y4srfxyxq5gvbevd6qhvh5aj_image.jpg',
    good: {
      brandName: 'CASK & CANE',
      productClass: 'RUM',
      alcoholContent: '80',
      netContents: '750 mL',
      manufacturerName: 'KCS BEVERAGE Company',
      manufacturerAddress: 'Durham, NC'
    }
  },
  {
    file: 'winelabel-example-600x480.webp',
    good: {
      brandName: 'Last Draw Vineyards',
      productClass: 'Orange Muscat',
      alcoholContent: '13.68%',
      netContents: '375 mL',
      manufacturerName: 'Hawk\'s Shadow Estate Winery',
      manufacturerAddress: 'Dripping Springs, Texas'
    }
  }
];

// Bad placeholder values (should not match)
const badValues = {
  brandName: 'Wrong Brand',
  productClass: 'Invalid Product Type',
  alcoholContent: '99%',
  netContents: '1000 mL',
  manufacturerName: 'Wrong Company',
  manufacturerAddress: 'Wrong Address'
};

// Test each image with both good and bad values
testImages.forEach((testImage) => {
  test(`Test ${testImage.file} - Good values`, async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('http://localhost:3001/');
    
    // Upload the image
    const filePath = `server/test-files/${testImage.file}`;
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await expect(page.locator('#imageInfo')).toHaveText(new RegExp(testImage.file));
    await expect(page.locator('#imagePreview')).toBeVisible();
    
    // Fill in good placeholder values
    await page.fill('#brandName', testImage.good.brandName);
    await page.fill('#productClass', testImage.good.productClass);
    await page.fill('#alcoholContent', testImage.good.alcoholContent);
    await page.fill('#netContents', testImage.good.netContents);
    await page.fill('#manufacturerName', testImage.good.manufacturerName);
    await page.fill('#manufacturerAddress', testImage.good.manufacturerAddress);
    
    // Submit the form
    await page.click('button:has-text("Verify Label")');
    
    // Wait for verification results
    await expect(page.locator('#verificationResults')).toBeVisible({ timeout: 90000 });
    
    // Verify that results contain "Match" status (good values should match)
    const resultsText = await page.locator('#verificationResults').textContent();
    expect(resultsText).toContain('Match');
    
    // Verify all verification items are present
    const verificationItems = page.locator('.verification-item');
    await expect(verificationItems).toHaveCount(6); // 6 required fields
    
    // Close the page
    await page.close();
    await context.close();
  });

  test(`Test ${testImage.file} - Bad values`, async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('http://localhost:3001/');
    
    // Upload the image
    const filePath = `server/test-files/${testImage.file}`;
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await expect(page.locator('#imageInfo')).toHaveText(new RegExp(testImage.file));
    await expect(page.locator('#imagePreview')).toBeVisible();
    
    // Fill in bad placeholder values
    await page.fill('#brandName', badValues.brandName);
    await page.fill('#productClass', badValues.productClass);
    await page.fill('#alcoholContent', badValues.alcoholContent);
    await page.fill('#netContents', badValues.netContents);
    await page.fill('#manufacturerName', badValues.manufacturerName);
    await page.fill('#manufacturerAddress', badValues.manufacturerAddress);
    
    // Submit the form
    await page.click('button:has-text("Verify Label")');
    
    // Wait for verification results
    await expect(page.locator('#verificationResults')).toBeVisible({ timeout: 90000 });
    
    // Verify that results contain "Not Found" status (bad values should not match)
    const resultsText = await page.locator('#verificationResults').textContent();
    expect(resultsText).toContain('Not Found');
    
    // Verify all verification items are present
    const verificationItems = page.locator('.verification-item');
    await expect(verificationItems).toHaveCount(6); // 6 required fields
    
    // Verify that most fields show low confidence (bad values)
    const notFoundStatuses = page.locator('.status-mismatch');
    const notFoundCount = await notFoundStatuses.count();
    expect(notFoundCount).toBeGreaterThan(3); // At least 4 out of 6 should not match
    
    // Close the page
    await page.close();
    await context.close();
  });
});
