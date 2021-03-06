#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import * as ssp from '@aws-quickstart/ssp-amazon-eks';

class SspConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);
    
    const teams: Array<ssp.Team> = [
      new ssp.PlatformTeam({
        name: 'team-awesome'
      }),
      new ssp.ApplicationTeam({
        name: 'burnham'
      }),
      new ssp.ApplicationTeam({
        name: 'riker'
      }),
      new ssp.ApplicationTeam({
        name: 'carmen'
      })
    ];

    const addOns: Array<ssp.ClusterAddOn> = [
      new ssp.AwsLoadBalancerControllerAddOn(),
      new ssp.NginxAddOn(),
      new ssp.ClusterAutoScalerAddOn(),
      new ssp.ContainerInsightsAddOn(),
      new ssp.MetricsServerAddOn(),
      new ssp.XrayAddOn(),
      new ssp.CalicoAddOn()
    ];

    const repoUrl = 'https://github.com/aws-samples/ssp-eks-workloads.git';

    const bootstrapRepo: ssp.ApplicationRepository = {
      repoUrl,
    }

    const devBootstrapArgo = new ssp.ArgoCDAddOn({
      bootstrapRepo: {
        ...bootstrapRepo,
        path: 'envs/dev'
      }
    });

    const prodBootstrapArgo = new ssp.ArgoCDAddOn({
      bootstrapRepo: {
        ...bootstrapRepo,
        path: 'envs/prod',
      },
    });

    const devBlueprint = ssp.EksBlueprint.builder()
      .teams(...teams)
      .addOns(...addOns.concat(devBootstrapArgo));

    const prodBlueprint = ssp.EksBlueprint.builder()
      .teams(...teams)
      .addOns(...addOns.concat(prodBootstrapArgo));

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
        stackBuilder: devBlueprint.clone('us-west-1')
      })
      .stage({
        id: 'us-east-1-ssp-prod',
        stackBuilder: prodBlueprint.clone('us-east-1'),
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