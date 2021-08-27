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

const capitalize = (str) => {
  if (str.includes(' ')) {
    return str
      .split(' ')
      .map((i) => i.charAt(0).toUpperCase() + i.slice(1))
      .join(' ');
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
};

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
    capitalized: capitalize(item.replace(/\-|\+|\*/g, '').split('#')[0]),
    tag:
      item.replace(/\-|\+|\*/g, '').split('#')[1] ||
      item.replace(/\-|\+|\*/g, '').replace(/\s/g, '_'),
    isDefault: item.includes('*'),
  });
};

const header = ['value', 'tag', 'default'];
const upperCases = [
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

const stringToCSV = (inputStr) => {
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

  arrFromInput.forEach((el, idx, arr) => {
    if (!el.match(/[^\-]/g) && el.includes('-')) {
      for (let i = 0; i < el.match(/\-/g).length; i++) {
        fieldLevels.pop();
      }
    } else {
      let { minus, plus, capitalized, tag, isDefault } = parseItem(el);
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
