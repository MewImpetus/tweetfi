import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/tweet_fi.tact',
    options: {
        debug: true,
    },
};
