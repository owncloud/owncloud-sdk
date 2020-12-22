import * as pact from '@pact-foundation/pact';
import { PactOptions } from '@pact-foundation/pact/dsl/options';
export declare type JestPactOptions = PactOptions & {
    timeout?: number;
    logDir?: string;
    logFileName?: string;
};
export declare type JestProvidedPactFn = (provider: pact.Pact) => void;
export declare const getProviderBaseUrl: (provider: pact.Pact) => string;
export declare const pactWith: (options: JestPactOptions, tests: JestProvidedPactFn) => void;
export declare const xpactWith: (options: JestPactOptions, tests: JestProvidedPactFn) => void;
export declare const fpactWith: (options: JestPactOptions, tests: JestProvidedPactFn) => void;
