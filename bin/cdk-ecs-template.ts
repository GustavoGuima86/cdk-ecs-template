#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {VpcCluster} from "../lib/vpc";
import {EcsCluster} from "../lib/ecs-cluster";
import {EcsService} from "../lib/ecs-services";

const app = new cdk.App();

const vpc = new VpcCluster(app, "ClusterVpc", {
    vpc_name: "gustavo-vpc"
});

const ecsCluster = new EcsCluster(app, "EcsCluster", {
    vpc: vpc.VpcCluster,
    cluster_name: "gustavo-cluster"
})

new EcsService(app, "EcsService", {
    vpc: vpc.VpcCluster,
    cluster: ecsCluster.EcsCluster
})