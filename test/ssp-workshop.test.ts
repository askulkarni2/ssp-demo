import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as SspWorkshop from '../lib/ssp-workshop-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new SspWorkshop.SspWorkshopStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
