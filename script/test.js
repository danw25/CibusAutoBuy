const { chromium } = require('playwright');
const { test, expect } = require('@playwright/test');


const userName = 'danweinstein';
const companyName = 'מיקרוסופט';
const password = '!Q2w3e4r';
const shuperSalPageUrl = 'https://consumers.pluxee.co.il/restaurants/pickup/restaurant/25500';
(async () => {


    // const res = minElementsToReachOrExceedTarget(267, [15, 30, 40, 50, 100, 200]);
    // console.log(res);
    // return;

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://consumers.pluxee.co.il/login');

    // Fill user name
    await fillInput(page, 'input#user', userName);

    // Click initial button
    await clickButton(page, 'button.login-btn');

    // Fill password
    await fillInput(page, 'input#password', password);

     // Fill company name
    await fillInput(page, 'input#company-inp', companyName);

    // Click  login button
    await clickButton(page, 'button.login-btn');

    // Get remaining budget
    const budget = 45;//await getBudget(page);

    await BuyVounchers(page, budget);



    console.log(budget);




    //await page.screenshot({ path: 'example.png' });
    //await browser.close();
})();

async function clearCart(page){
  console.log("Clearing cart");
  await clickButton(page, 'button.deleteBtn');
  await clickButton(page, 'button.yesBtn');
  console.log("Cart cleared");
}

async function confirmBuy(page){
  console.log("Confirming buy");
  await clickButton(page, 'button.finishOrderBtn');
  await clickButton(page, 'button.submit-order');
  console.log("Buy confirmed");
}

async function waitForNoItems(page)
{
  console.log("Waiting for no items in cart");
  await page.waitForFunction(() => {
    const cartIcon = document.querySelector('app-icon-cart');
    if (!cartIcon) return false;
    return !cartIcon.querySelector('.show-counter');
  });
  console.log("No items in cart");
}
async function goToCart(page){
  try {
    console.log("Going to cart");
    await page.waitForSelector('cib-cart-wrap');
    const component = await page.$('cib-cart-wrap');
    await component.waitForSelector('span:text("1")');
    await component.click();
    console.log("Cart opened");
  } catch (error) {
    console.error('Error in goToCart:', error);
  }
}

async function BuyVounchers(page, budget) {
  console.log("BuyVounchers");
  await page.waitForSelector('div.budget');
  await page.goto(shuperSalPageUrl);
  await page.waitForSelector('div.budget');
  let cardKeys = (await findVoucherValues2(page)).keys();
    const vouchersToBuy = minElementsToReachOrExceedTarget(budget, [...cardKeys]);
    console.log(vouchersToBuy);
    for( let voucherValue of vouchersToBuy){
        let matchingCards = await findVoucherValues2(page);
        await buySingleVoucher(page,matchingCards,voucherValue);
        await page.goto(shuperSalPageUrl);
        await page.waitForSelector('div.budget');
    }
    console.log("Done buying vouchers");
}
async function buySingleVoucher(page,matchingCards,voucherValue){
    console.log("buying a single voucher for ",voucherValue);
    const card = matchingCards.get(voucherValue);
    await addVouchersToCart(page,card);
    await goToCart(page);
    const isTest = false; // change to false to actually buy
    if(isTest){
      await clearCart(page)
    }
    else{
      await confirmBuy(page)
    }
    const isCleared = await waitForNoItems(page);
    console.log("Cart is empty");
}


async function addVouchersToCart(page,card){
  console.log("adding to cart");

  await card.waitForSelector('button');
  const button = await card.$$('button');
  await button[0].click();
}

async function findVoucherValues(page){
    console.log('findVoucherValues');
    const cards = await page.$$('app-rest-menu-card label');
    const matchingCards = [];
    const seenValues = new Set(); // Set to keep track of unique values

    for (let card of cards) {
        const text = await card.textContent();
        if (text.startsWith('₪') && !seenValues.has(text)) {
            console.log(text);
            matchingCards.push(card);
            seenValues.add(text); // Add the value to the set
        }
    }

    // Convert the Set to an array of numbers
    const seenValuesArray = Array.from(seenValues, value => Number(value.replace('₪', '')));

    return { matchingCards, seenValuesArray };
}


async function findVoucherValues2(page){
  await page.waitForSelector('app-rest-menu-card');
  const cards = await page.$$('app-rest-menu-card');
  const matchingCards = new Map();
  for (let card of cards) {
      const labels = await card.$$('label');
      for (let label of labels) {
          const text = await label.textContent();
          if (text.startsWith('₪')) {
          const number = Number(text.replace('₪', ''));
              if(!matchingCards.has(number)) {
                  matchingCards.set(number, card);
              }
          }
      }
  }
  return matchingCards;
}


async function fillInput(page, selector, value) {
    await page.waitForSelector(selector);
    await page.fill(selector, value);
}

async function clickButton(page, selector) {
    console.log("clicking button", selector);
    await page.waitForSelector(selector);
    await page.click(selector);
}

async function getBudget(page) {
    const budgetSelector = 'div.budget.ng-star-inserted';
    await page.waitForSelector(budgetSelector);
    const budgetText = await page.textContent(budgetSelector);
    const regex = /\d+\.\d+/;
    const match = budgetText.match(regex);
    const number = match ? parseFloat(match[0]) : null;
    return number;
}

function minElementsToReachOrExceedTarget(target, array) {
    target = Math.ceil(target);
    const maxVal = target + Math.max(...array);
    const dp = new Array(maxVal + 1).fill(Infinity);
    const elements = new Array(maxVal + 1).fill(null);
    dp[0] = 0;  // Base case: zero elements to make sum 0
    elements[0] = [];  // No elements used to make sum 0

    for (let currentSum = 1; currentSum <= maxVal; currentSum++) {
        for (let num of array) {
            if (currentSum >= num && dp[currentSum - num] + 1 < dp[currentSum]) {
                dp[currentSum] = dp[currentSum - num] + 1;
                elements[currentSum] = (elements[currentSum - num] || []).concat(num);
            }
        }
    }

    // Find the smallest sum >= target
    for (let sumValue = target; sumValue <= maxVal; sumValue++) {
        if (dp[sumValue] !== Infinity) {
            return elements[sumValue];
        }
    }

    return [];  // In case no solution is found (shouldn't happen with proper inputs)
}

function findSum(target, array) {
    const windowSize = Math.max(...array); // Get the maximum element for window size
    const dp = new Array(windowSize + 1).fill(Infinity); // Limited size dp table
    dp[0] = 0; // Base case

    for (let num of array) {
      // Iterate through each number in the array
      for (let i = 1; i <= windowSize; i++) {
        if (i >= num) {
          // Update only relevant positions in the window
          dp[i] = Math.min(dp[i], dp[i - num] + num);
        }
      }
    }

    if (dp[target] === Infinity) {
      return null;
    }

    // Backtracking logic remains the same (can use a separate function)
    return backtrack(target, array, dp, windowSize);
  }

  function backtrack(target, array, dp, windowSize) {
    const combination = [];
    let i = target;
    while (i > 0) {
      for (const num of array) {
        if (dp[i] === dp[i - num] + num && i - num >= 0) {
          combination.push(num);
          i -= num;
          break;
        }
      }
    }
    return combination.reverse();
  }

  function findSum2(target, array, memo = {}) {
    if (target in memo) {
      return memo[target];
    }

    if (target === 0) {
      return [];
    }

    let minCombination = null;
    for (const num of array) {
      const remaining = target - num;
      if (remaining >= 0) {
        const result = findSum2(remaining, array, memo);
        if (result && (!minCombination || result.length < minCombination.length)) {
          minCombination = result.concat(num);
        }
      }
    }

    memo[target] = minCombination;
    return minCombination;
  }

  // Example usage remains the same

// Test input
// const target = 267;
// const array = [15, 30, 40, 50, 100, 200];

// const [closestSum, minElements] = minElementsToReachOrExceedTarget(array, target);
// console.log(`Closest Sum: ${closestSum}, Minimum Elements: ${minElements}`);
