const fieldValues = document.querySelector('#field-values');
const prefixField = document.querySelector('#prefix');
const suffixField = document.querySelector('#suffix');
const defaultField = document.querySelector('#default-field');
const submitValues = document.querySelector('#submit-values');
const filenameField = document.querySelector('#filename');
let prefix = '';
let suffix = '';

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds.
const debounce = (func, timeout = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
};

const downloadBtnOnOff = (fields) => {
  if (fields) {
    submitValues.removeAttribute('disabled');
  } else {
    submitValues.setAttribute('disabled', 'disabled');
  }
};

const listenToInputButDontCrash = debounce((fields) =>
  downloadBtnOnOff(fields)
);

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const randomHex = () => Math.floor(Math.random() * 16777215).toString(16);

const download = (filename, text) => {
  let element = document.createElement('a');
  element.setAttribute(
    'href',
    'data:text/csv;charset=utf-8,' + encodeURIComponent(text)
  );
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
};

const parseItem = function (item) {
  return (parsed = {
    minus: (item.match(/\-/g) || []).length,
    plus: (item.match(/\+/g) || []).length,
    clean: item
      .replace(/\-|\+|\*/g, '')
      .split('#')[0]
      .trim(),
    tag:
      item.replace(/\-|\+|\*/g, '').split('#')[1] ||
      item
        .replace(/\-|\+|\*/g, '')
        .trim()
        .replace(/\s/g, '_'),
    isDefault: item.includes('*'),
  });
};

const header = ['value', 'tag', 'default'];

//todo: implement acronym uppercase
function uppercaseAcronymMatchingAgainstArray(input, array, callback) {
  const regex = new RegExp(`^${input}`, 'i');
  const matches = array.filter((el) => regex.test(el));
  callback(matches);
}
const acronyms = [
  'css',
  'csp',
  'cors',
  'html',
  'http',
  'https',
  'json',
  'js',
  'svg',
];

const capitalizeWithAcronyms = (item) => {
  let splitItem = item.split(' ');
  if (typeof splitItem === 'string') {
    return acronyms.indexOf(splitItem.toLowerCase()) !== -1
      ? splitItem.toUpperCase()
      : item;
  } else {
    return splitItem
      .map((el) =>
        acronyms.indexOf(el) !== -1 ? el.toUpperCase() : capitalize(el)
      )
      .join(' ');
  }
};

const stringToCSV = async (inputStr) => {
  const arrFromInput = inputStr.split(/\,|\n|\r/);
  const fieldLevels = [];
  const csv = [];
  const randomAppendix =
    new Date().toLocaleDateString().replace(/\//g, '-') + '_' + randomHex();
  const filename =
    filenameField.value !== ''
      ? filenameField.value + '_' + randomAppendix + '.csv'
      : 'ticket_fields_' + randomAppendix + '.csv';
  csv.push(header.join(','));

  await arrFromInput.forEach((el, idx, arr) => {
    if (!el.match(/[^\-|\s]/g) && el.includes('-')) {
      for (let i = 0; i < el.match(/\-/g).length; i++) {
        fieldLevels.pop();
      }
    } else {
      let { minus, plus, clean, tag, isDefault } = parseItem(el);
      let capitalized = capitalizeWithAcronyms(clean);

      if (minus > 0) {
        for (let i = 0; i < minus; i++) {
          fieldLevels.pop();
        }
      }

      fieldLevels.push(capitalized);
      csv.push(
        fieldLevels.join('::') +
          ',' +
          prefix +
          tag +
          suffix +
          ',' +
          isDefault.toString()
      );

      if (plus <= 0) {
        fieldLevels.pop();
      }
    }
  });

  download(filename, csv.join('\n'));
};

document.addEventListener('submit', (e) => {
  e.preventDefault();
});

fieldValues.addEventListener('input', () => {
  listenToInputButDontCrash(fieldValues.value);
});

submitValues.addEventListener('click', () => {
  prefix = prefixField.value !== '' ? prefixField.value + '_' : '';
  suffix = suffixField.value !== '' ? '_' + suffixField.value : '';
  stringToCSV(fieldValues.value);
});
