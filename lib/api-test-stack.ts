import {
  CustomResource,
  Duration,
  NestedStack,
  NestedStackProps,
  RemovalPolicy,
} from "aws-cdk-lib";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Provider } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import * as path from "path";
import { Lambda } from "./constructs/lambda";

interface ApiTestStackProps extends NestedStackProps {
  apiBaseUrl: String;
}

export class ApiTestStack extends NestedStack {
  constructor(scope: Construct, id: string, props: ApiTestStackProps) {
    super(scope, id, props);

    // our implementation of the CR provider
    // (right lambda in presentation img)
    const onEventHandler = new Lambda(scope, "TestHandler", {
      entry: path.join(__dirname, "handler", "api-test", "index.ts"),
    });

    // connect our Lambda to CDK Provider Framework
    // (left lambda in presentation img)
    const testProvider = new Provider(scope, "TestProvider", {
      logRetention: RetentionDays.ONE_DAY,
      onEventHandler,

      // for async tests
      // isCompleteHandler: undefined,
      // totalTimeout: Duration.minutes(5),
    });

    // connect the pieces to receive CR lifecycle events
    new CustomResource(scope, "TestResource", {
      properties: {
        // forces an update on every deployment; custom resource provider only re-executed on prop change
        timestamp: new Date().getTime().toString(),
        apiBaseUrl: props.apiBaseUrl,
      },
      serviceToken: testProvider.serviceToken,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
