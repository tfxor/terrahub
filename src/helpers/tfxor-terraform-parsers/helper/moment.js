'use strict';

const newLocal = 'moment-timezone';
const moment = require(newLocal);
moment.tz.setDefault('UTC');

moment.updateLocale('en', {
  week: {
    dow: 0, // First day of week is Sunday
    doy: 6 // First week of year must contain 1 January (7 + 0 - 1)
  }
});

class Moment {
  /**
   * @returns {Number}
   */
  static nowAsUnix() {
    return moment().unix();
  }

  /**
   * @returns {String}
   */
  static nowAsString() {
    return moment().toISOString();
  }

  /**
   * @returns {Number}
   */
  static nowDateNumber() {
    return moment().date();
  }

  /**
   * @returns {Number}
   */
  static nowMonthNumber() {
    return moment().month() + 1;
  }

  /**
   * @returns {Number}
   */
  static nowWeekOfYearNumber() {
    return moment().week();
  }

  /**
   * @returns {Number}
   */
  static nowYearNumber() {
    return moment().year();
  }

  /**
   * @returns {Number}
   */
  static nowWeekYearNumber() {
    return moment().weekYear();
  }

  /**
   * Format UNIX epoch time
   * @param {Number} unix
   * @returns {String}
   */
  static formatUnixToDate(unix) {
    return moment(moment.unix(unix)).format('MMM Do, YYYY');
  }

  /**
   * Format string
   * @param {String} source
   * @returns {String}
   */
  static formatStringToDate(source) {
    return moment(source).format('MMM Do, YYYY');
  }

  /**
   * Format string date
   * @param {String} source
   * @returns {String}
   */
  static formatDateString(source) {
    return moment(source).format('MMMM Do, YYYY [at] h:mm a');
  }

  /**
   * Format string date
   * @param {String} source
   * @returns {String}
   */
  static formatDateOnlyString(source) {
    return moment(source).format('MMMM Do, YYYY');
  }

  /**
   * Get next week number from current week of year
   * @returns {Number}
   */
  static getNxtWeekFromCurrWeekOfYearNumber() {
    return moment().add(1, 'week').week();
  }

  /**
   * Get next week year number from current week of year
   * @returns {Number}
   */
  static getNxtYearFromCurrWeekOfYearNumber() {
    return moment().add(1, 'week').weekYear();
  }

  /**
   * Get prev week number from current week of year
   * @returns {Number}
   */
  static getPrvWeekFromCurrWeekOfYearNumber() {
    return moment().subtract(1, 'week').week();
  }

  /**
   * Get prev year number from current week of year
   * @returns {Number}
   */
  static getPrvYearFromCurrWeekOfYearNumber() {
    return moment().subtract(1, 'week').weekYear();
  }

  /**
   * Get end of month UNIX epoch time
   * @returns {Number}
   */
  static getEndOfMonthAsUnix() {
    return moment().endOf('month').unix();
  }

  /**
   * Get end of last month UNIX epoch time
   * @returns {Number}
   */
  static getEndOfLastMonthAsUnix() {
    return moment().subtract(1, 'month').endOf('month').unix();
  }

  /**
   * Get start of month UNIX epoch time
   * @returns {Number}
   */
  static getStartOfMonthAsUnix() {
    return moment().startOf('month').unix();
  }

  /**
   * Get start of last month UNIX epoch time
   * @returns {Number}
   */
  static getStartOfLastMonthAsUnix() {
    return moment().subtract(1, 'month').startOf('month').unix();
  }

  /**
   * Get EOD as UNIX epoch time from source
   * @param {Number | String} time
   * @returns {Number}
   */
  static getEodFromSourceAsUnix(time) {
    if (time instanceof Number && Number.isInteger(time)) {
      return moment(moment.unix(time)).endOf('day').unix();
    }

    if (time instanceof String) {
      return moment(time).endOf('day').unix();
    }
  }

  /**
   * Get first date next month from now as unix
   * @returns {Number}
   */
  static getFirstDateOfNextMonthFromNowAsUnix() {
    return moment().endOf('month').add(1, 'second').unix();
  }

  /**
   * Get first date next month from now as unix
   * @returns {Number}
   */
  static getFirstDateOfNextYearFromNowAsUnix() {
    return moment().endOf('year').add(1, 'second').unix();
  }

  /**
   * Is today first date of month
   * @returns {Boolean}
   */
  static isTodayFirstDateOfMonth() {
    return moment().date() === 1;
  }

  /**
   * @param {String|Number} first
   * @param {String|Number} second
   * @returns {Boolean}
   */
  static areDatesAndMonthsEqual(first, second) {
    if (first instanceof Number && Number.isInteger(first) && second instanceof Number && Number.isInteger(second)) {
      const dateFirst = moment(moment.unix(first)).date();
      const monthFirst = moment(moment.unix(first)).month() + 1;

      const dateSecond = moment(moment.unix(second)).date();
      const monthSecond = moment(moment.unix(second)).month() + 1;

      return dateFirst === dateSecond && monthFirst === monthSecond;
    }

    if (
      (typeof first === 'string' || first instanceof String)
      && (typeof second === 'string' || second instanceof String)
    ) {
      const dateFirst = moment(first).date();
      const monthFirst = moment(first).month() + 1;

      const dateSecond = moment(second).date();
      const monthSecond = moment(second).month() + 1;

      return dateFirst === dateSecond && monthFirst === monthSecond;
    }

    return false;
  }

  /**
   * Parse UNIX epoch time
   * @param {Number} unix
   * @returns {{ dateOfMonth: Number, month: Number, year: Number }}
   */
  static parseUnix(unix) {
    const date = moment(moment.unix(unix));

    return {
      dateOfMonth: date.get('date'),
      month: date.get('month') + 1,
      year: date.get('year')
    };
  }

  /**
   * to unix
   * @param {String} source
   * @returns {Number}
   */
  static toUnix(source) {
    return moment(source).unix();
  }

  /**
   * to ISO
   * @param {String} source
   * @returns {Number}
   */
  static toISOString(source) {
    return moment(source).toISOString();
  }

  /**
   * Add time
   * @param {Number} quantity
   * @param {String} unit
   * @returns {String}
   */
  static addAsUnix(quantity, unit) {
    return moment().add(quantity, unit).unix();
  }

  /**
   * Add time to
   * @param {String} source
   * @param {Number} quantity
   * @param {String} unit
   * @returns {String|null}
   */
  static addToSpecificDateAsString(source, quantity, unit) {
    if (typeof source === 'string' || source instanceof String) {
      return moment(source).add(quantity, unit);
    }

    return null;
  }

  /**
   * Subtract time
   * @param {Number} quantity
   * @param {String} unit
   * @returns {String}
   */
  static subtractAsUnix(quantity, unit) {
    return moment().subtract(quantity, unit).unix();
  }

  /**
   * diff dates
   * @param {Number} first
   * @param {Number} second
   * @returns {Number}
   */
  static diffDatesUnix(first, second) {
    const a = moment(first);
    const b = moment(second);

    return b.diff(a, 'days');
  }
}

module.exports = Moment;
