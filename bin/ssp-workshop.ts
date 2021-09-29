#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as ssp from '@aws-quickstart/ssp-amazon-eks';

class TeamBurnham extends ssp.ApplicationTeam {
  constructor(scope: cdk.Construct) {
    super({
      name: 'team-burnham',
      userRole: new iam.Role(scope, 'team-burnham', {
        assumedBy: new iam.AccountRootPrincipal(),
        managedPolicies: [
          {
            managedPolicyArn:iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess').managedPolicyArn
          }
        ]
      })
    })
  }
}
class SspConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);
    
    const blueprint = ssp.EksBlueprint.builder()
      .teams(
        new TeamBurnham(scope),
        new ssp.PlatformTeam({
          name: 'team-awesome'
        })
      )
      .addOns(
        new ssp.AwsLoadBalancerControllerAddOn(),
        new ssp.NginxAddOn(),
        new ssp.ClusterAutoScalerAddOn(),
        new ssp.ContainerInsightsAddOn(),
        new ssp.MetricsServerAddOn(),
        new ssp.XrayAddOn(),
        new ssp.ArgoCDAddOn()
      );

    ssp.CodePipelineStack.builder()
      .name('ssp-pipeline')
      .owner('askulkarni2')
      .repository({
        repoUrl: 'ssp-demo',
        credentialsSecretName: 'github-token',
        branch: 'main'
      })
      .stage({
        id: 'us-west-1-ssp-dev',
        stackBuilder: blueprint.clone('us-west-1')
      })
      .stage({
        id: 'us-west-2-ssp-prod',
        stackBuilder: blueprint.clone('us-west-2'),
        stageProps: {
          manualApprovals: true
        }
      })
      .build(scope, 'ssp-pipeline', props);
  }
}

const app = new cdk.App();

new SspConstruct(app, 'ssp-stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION
  }
});
