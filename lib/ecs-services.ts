import {Duration, Stack, StackProps} from "aws-cdk-lib";
import {InstanceClass, InstanceSize, InstanceType, Vpc} from "aws-cdk-lib/aws-ec2";
import {Construct} from "constructs";
import {
    Cluster,
    ContainerImage,
    Ec2Service,
    Ec2TaskDefinition,
    FargateService,
    FargateTaskDefinition, LogDrivers
} from "aws-cdk-lib/aws-ecs";
import {ApplicationLoadBalancer, ListenerCondition} from "aws-cdk-lib/aws-elasticloadbalancingv2";

export interface EcsServiceProps extends StackProps {
    vpc: Vpc
    cluster: Cluster
}

export class EcsService extends Stack {

    constructor(scope: Construct, id: string, props: EcsServiceProps) {
        super(scope, id, props);

        const cluster = props.cluster

        const taskDefinitionFargate = new FargateTaskDefinition(this, 'TaskDefFargate');

        taskDefinitionFargate.addContainer('NginxContainerService1', {
            image: ContainerImage.fromAsset('./services/service1'),
            logging: LogDrivers.awsLogs({
                streamPrefix: 'ecs',
            }),
            memoryLimitMiB: 512,
            cpu: 256,
            portMappings: [{ containerPort: 80 }],
        });

        const service1 = new FargateService(this, 'NginxService1', {
            cluster,
            taskDefinition: taskDefinitionFargate,
            desiredCount: 1,
        });

        cluster.addCapacity('SpotAutoScalingGroup', {
            instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
            desiredCapacity: 1,
            spotPrice: "0.10",
        });

        const taskDefinitionEC2 = new Ec2TaskDefinition(this, 'TaskDefEC2');

        taskDefinitionEC2.addContainer('NginxContainerService2', {
            image: ContainerImage.fromAsset('./services/service2/'),
            logging: LogDrivers.awsLogs({
                streamPrefix: 'ecs',
            }),
            memoryLimitMiB: 512,
            portMappings: [{ containerPort: 80 }],
        });

        const service2 = new Ec2Service(this, 'Ec2Service', {
            cluster,
            taskDefinition: taskDefinitionEC2,
            desiredCount: 1,
        });


        const alb = new ApplicationLoadBalancer(this, 'ALB', {
            vpc: props.vpc,
            internetFacing: true,
        });

        const listener = alb.addListener('Listener', {
            port: 80,
            open: true,
        });
        listener.addTargets('DefaultTargetGroup', {
            targets: [service1],
            port: 80,
            healthCheck: {
                path: '/'
            },
        });

        listener.addTargets('ServiceATargetGroup', {
            priority: 1,
            conditions: [
                ListenerCondition.pathPatterns(["/service1"])
            ],
            targets: [service1],
            port: 80,
            healthCheck: {
                path: '/'
            },
        });

        listener.addTargets('ServiceBTargetGroup', {
            priority: 2,
            conditions: [
                ListenerCondition.pathPatterns(["/service2"])
            ],
            targets: [service2],
            port: 80,
            healthCheck: {
                path: '/'
            },
        });
    }
}
