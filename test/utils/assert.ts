import { AssertionError } from "assert";
import * as chai from "chai";
import chaiExclude from "chai-exclude";
import chaiString from "chai-string";
import deepEqualInAnyOrder from "deep-equal-in-any-order";
import chaiDateTime from "chai-datetime";
import chaiSorted from "chai-sorted";
import chaiJsonSchemaAjv from "chai-json-schema-ajv";
import { JsonSchema } from "../types/common/IJsonSchema";
import Ajv from "ajv";
import addAjvFormats from "ajv-formats";

const ajv = addAjvFormats(new Ajv());
chai.use(
  chaiJsonSchemaAjv.create({
    verbose: true,
    ajv,
  }),
);
chai.use(chaiString);
chai.use(deepEqualInAnyOrder);
chai.use(chaiDateTime);
chai.use(chaiSorted);
chai.use(chaiExclude);
const assert = chai.assert;
const expect = chai.expect;

export default class Assert {
  static isFalse(value: unknown, message?: string): void {
    assert.isFalse(value, message);
  }

  static isTrue(value: unknown, message?: string): void {
    assert.isTrue(value, message);
  }

  static isAbove(
    valueToCheck: number,
    valueToBeAbove: number,
    message?: string,
  ): void {
    assert.isAbove(valueToCheck, valueToBeAbove, message);
  }

  static equalOrAbove(
    valueToCheck: number,
    valueToBeEqualToOrAbove: number,
    message?: string,
  ): void {
    assert.isTrue(valueToCheck >= valueToBeEqualToOrAbove, message);
  }

  static isAtMost(
    valueToCheck: number,
    valueToBeAtMost: number,
    message?: string,
  ): void {
    assert.isAtMost(valueToCheck, valueToBeAtMost, message);
  }

  static equal<T>(actual: T, expected: T, message?: string): void {
    assert.equal(actual, expected, message);
  }

  static isNull(value: unknown, message?: string): void {
    assert.isNull(value, message);
  }

  static oneOf(inList: unknown, list: unknown[], message?: string): void {
    assert.oneOf(inList, list, message);
  }

  static lengthOf(
    object: { readonly length?: number },
    length: number,
    message?: string,
  ): void {
    assert.lengthOf(object, length, message);
  }

  static deepEqual<T>(actual: T, expected: T, message?: string): void {
    assert.deepEqual(actual, expected, message);
  }

  static notDeepEqual<T>(
    firstValue: T,
    secondValue: T,
    message?: string,
  ): void {
    assert.notDeepEqual(firstValue, secondValue, message);
  }

  static deepEqualExcluding<T>(
    actual: T | T[],
    expected: T | T[],
    props: keyof T | (keyof T)[],
    failureMsg?: string,
  ) {
    assert.deepEqualExcluding(actual, expected, props, failureMsg);
  }

  static notDeepEqualExcluding<T>(
    actual: T | T[],
    expected: T | T[],
    props: keyof T | (keyof T)[],
    failureMsg?: string,
  ) {
    try {
      assert.deepEqualExcluding(actual, expected, props, failureMsg);
      throw new AssertionError({
        message: `two operands are deep equal excluding ${JSON.stringify(
          props,
        )}`,
      });
    } catch (e: any) {
      if (e.name !== AssertionError.name) {
        throw e;
      }
    }
  }

  static deepIncludeExcluding<T>(
    haystack: T[],
    needle: T,
    props: keyof T | (keyof T)[],
    message?: string,
  ): void {
    for (let element of haystack) {
      try {
        Assert.deepEqualExcluding(element, needle, props);
        return;
      } catch (e: any) {
        if (e.name !== AssertionError.name) {
          throw e;
        }
      }
    }
    throw new AssertionError({
      message:
        message ||
        `${JSON.stringify(haystack)} includes ${JSON.stringify(needle)}`,
    });
  }

  static deepIncludeByProperties<T>(
    haystack: T[],
    needle: T,
    props: keyof T | (keyof T)[],
    message?: string,
  ): void {
    let modifiedHaystack: T[] = [];
    for (let item of haystack) {
      let modifiedItem: any = {};
      if (Array.isArray(props)) {
        props.forEach((prop) => (modifiedItem[prop] = item[prop]));
      } else {
        modifiedItem[props] = item[props];
      }
      modifiedHaystack.push(modifiedItem);
    }
    let modifiedNeedle: any = {};
    if (Array.isArray(props)) {
      props.forEach((prop) => (modifiedNeedle[prop] = needle[prop]));
    } else {
      modifiedNeedle[props] = needle[props];
    }
    Assert.deepInclude(modifiedHaystack, modifiedNeedle, message);
  }

  static notDeepIncludeByProperties<T>(
    haystack: T[],
    needle: T,
    props: keyof T | (keyof T)[],
    message?: string,
  ): void {
    let modifiedHaystack: T[] = [];
    for (let item of haystack) {
      let modifiedItem: any = {};
      if (Array.isArray(props)) {
        props.forEach((prop) => (modifiedItem[prop] = item[prop]));
      } else {
        modifiedItem[props] = item[props];
      }
      modifiedHaystack.push(modifiedItem);
    }
    let modifiedNeedle: any = {};
    if (Array.isArray(props)) {
      props.forEach((prop) => (modifiedNeedle[prop] = needle[prop]));
    } else {
      modifiedNeedle[props] = needle[props];
    }
    Assert.notDeepInclude(modifiedHaystack, modifiedNeedle, message);
  }

  static notEqual(actual: unknown, expected: unknown, message?: string): void {
    assert.notEqual(actual, expected, message);
  }

  static include(haystack: string, needle: string, message?: string): void;
  static include<T>(
    haystack: readonly T[] | ReadonlySet<T> | ReadonlyMap<any, T>,
    needle: T,
    message?: string,
  ): void;
  static include<T extends Record<string, unknown>>(
    haystack: WeakSet<T>,
    needle: T,
    message?: string,
  ): void;
  static include<T>(haystack: T, needle: Partial<T>, message?: string): void;
  static include(...params: Parameters<typeof assert.include>): void {
    assert.include(...params);
  }

  static startsWith(val: string, exp: string, msg?: string): void {
    assert.startsWith(val, exp, msg);
  }

  static startsWithIgnoreCase(val: string, exp: string, msg?: string): void {
    assert.startsWith(val.toLowerCase(), exp.toLowerCase(), msg);
  }

  static endsWith(val: string, exp: string, msg?: string): void {
    assert.endsWith(val, exp, msg);
  }

  static endsWithIgnoreCase(val: string, exp: string, msg?: string): void {
    assert.endsWith(val.toLowerCase(), exp.toLowerCase(), msg);
  }

  /** @deprecated Does not have any effect on string. Use Assert#notInclude instead. */
  static notDeepInclude(
    haystack: string,
    needle: string,
    message?: string,
  ): void;
  static notDeepInclude<T>(
    haystack: readonly T[] | ReadonlySet<T> | ReadonlyMap<any, T>,
    needle: T,
    message?: string,
  ): void;
  static notDeepInclude<T>(
    haystack: T,
    needle: T extends WeakSet<any> ? never : Partial<T>,
    message?: string,
  ): void;
  static notDeepInclude(
    ...params: Parameters<typeof assert.notDeepInclude>
  ): void {
    assert.notDeepInclude(...params);
  }

  static sameDeepMembers(
    set1: unknown[],
    set2: unknown[],
    message?: string,
  ): void {
    assert.sameDeepMembers(set1, set2, message);
  }

  static sameDeepMembersByProperties<T>(
    set1: T[],
    set2: T[],
    props: (keyof T)[],
    message?: string,
  ): void {
    let modifiedSet1 = set1.map((item) => {
      let modifiedItem: any = {};
      props.forEach((prop) => (modifiedItem[prop] = item[prop]));
      return modifiedItem;
    });
    let modifiedSet2 = set2.map((item) => {
      let modifiedItem: any = {};
      props.forEach((prop) => (modifiedItem[prop] = item[prop]));
      return modifiedItem;
    });
    Assert.sameDeepMembers(modifiedSet1, modifiedSet2, message);
  }

  static deepStrictEqual(
    actual: unknown,
    expected: unknown,
    message?: string,
  ): void {
    assert.deepStrictEqual(actual, expected, message);
  }

  /** @deprecated Does not have any effect on string. Use Assert#include instead */
  static deepInclude(haystack: string, needle: string, message?: string): void;
  static deepInclude<T>(
    haystack: readonly T[] | ReadonlySet<T> | ReadonlyMap<any, T>,
    needle: T,
    message?: string,
  ): void;
  static deepInclude<T>(
    haystack: T,
    needle: T extends WeakSet<any> ? never : Partial<T>,
    message?: string,
  ): void;
  static deepInclude(...params: Parameters<typeof assert.deepInclude>): void {
    assert.deepInclude(...params);
  }

  static equalIgnoreCase(val: string, exp: string, msg?: string): void {
    assert.equalIgnoreCase(val, exp, msg);
  }

  static isDefined(value: unknown, message?: string): void {
    assert.isDefined(value, message);
  }

  static match(value: string, regexp: RegExp, message?: string): void {
    assert.match(value, regexp, message);
  }

  static closeToTime(
    val: Date,
    exp: Date,
    deltaInSeconds: number,
    msg?: string,
  ): void {
    assert.closeToTime(val, exp, deltaInSeconds, msg);
  }

  static closeTo(
    actual: number,
    expected: number,
    delta: number,
    message?: string,
  ): void {
    assert.closeTo(actual, expected, delta, message);
  }

  static exists(value: unknown, message?: string): void {
    assert.exists(value, message);
  }

  static isEmpty(object: unknown, message?: string): void {
    assert.isEmpty(object, message);
  }

  static sortedBy<T>(
    arrayOfObjects: T[],
    propertyName: keyof T,
    descending = false,
    message?: string,
  ): void {
    expect(arrayOfObjects, message).to.be.sortedBy(String(propertyName), {
      descending,
    });
  }

  static isAtLeast(
    valueToCheck: number,
    valueToBeAtLeast: number,
    message?: string,
  ): void {
    assert.isAtLeast(valueToCheck, valueToBeAtLeast, message);
  }

  static fail(message?: string): never;
  static fail<T>(
    actual: T,
    expected: T,
    message?: string,
    operator?: string,
  ): never;
  static fail(...args: any[]): void {
    if (args.length > 1) {
      assert.fail(args[0], args[1], args[2], args[3]);
    } else {
      assert.fail(args[0]);
    }
  }

  static isString(value: unknown, message?: string): void {
    assert.isString(value, message);
  }

  static isNotEmpty(object: unknown, message?: string): void {
    assert.isNotEmpty(object, message);
  }

  static ok(value: unknown, message?: string): void {
    assert.ok(value, message);
  }

  static notInclude(haystack: string, needle: string, message?: string): void;
  static notInclude<T>(
    haystack: readonly T[] | ReadonlySet<T> | ReadonlyMap<any, T>,
    needle: T,
    message?: string,
  ): void;
  static notInclude<T extends Record<string, unknown>>(
    haystack: WeakSet<T>,
    needle: T,
    message?: string,
  ): void;
  static notInclude<T>(haystack: T, needle: Partial<T>, message?: string): void;
  static notInclude(...params: Parameters<typeof assert.notInclude>): void {
    assert.notInclude(...params);
  }

  static almostEqual(actual: number, expected: number, tolerance = 0.01): void {
    Assert.isTrue(
      actual >= expected - tolerance && actual <= expected + tolerance,
    );
  }

  static isNumber(...params: Parameters<typeof assert.isNumber>): void {
    assert.isNumber(...params);
  }

  static biggerThan(
    num: number,
    toBeBiggerThan: number,
    message?: string,
  ): void {
    Assert.isTrue(num > toBeBiggerThan, message);
  }

  static lessThan(num: number, toBeLessThan: number, message?: string): void {
    Assert.isTrue(num < toBeLessThan, message);
  }

  static jsonSchema<T>(
    actualObject: any,
    expectedSchema: JsonSchema<T>,
    message?: string,
  ): actualObject is T {
    // @ts-ignore
    assert.jsonSchema(actualObject, expectedSchema, message);
    return true;
  }

  static lengthOfArrayBiggerThan(
    array: any[],
    length: number,
    message?: string,
  ) {
    assert.isAbove(array.length, length, message);
  }
}
