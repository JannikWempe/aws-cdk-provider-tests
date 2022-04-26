import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Api } from "./api";
import { ApiTestStack } from "./api-test-stack";

export class NotesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const api = new Api(this, "Api");

    // testing the API
    const apiTestStack = new ApiTestStack(this, "Test", {
      apiBaseUrl: api.url,
    });
    // ensure tests will be executed after api is deployed/updated
    apiTestStack.node.addDependency(api);
  }
}
