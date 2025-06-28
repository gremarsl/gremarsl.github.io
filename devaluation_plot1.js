const years1 = [2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];

const devaluation_ger = [base];

for (let i = 0; i < inflation_rate_germany.length; i++) {
  // Multiply previous value by (1 + inflation rate of this year)
  devaluation_ger.push(devaluation_ger[i] * (1 + inflation_rate_germany[i]/100));
}

const devaluation_us = [base];

for (let i = 0; i < inflation_rate_us.length; i++) {
  // Multiply previous value by (1 + inflation rate of this year)
  devaluation_us.push(devaluation_us[i] * (1 + inflation_rate_us[i]/100));
}


const devaluation_swiss = [base];

for (let i = 0; i < inflation_rate_switzerland.length; i++) {
  // Multiply previous value by (1 + inflation rate of this year)
  devaluation_swiss.push(devaluation_swiss[i] * (1 + inflation_rate_switzerland[i]/100));
}

