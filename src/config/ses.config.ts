import { SESClient } from "@aws-sdk/client-ses";

const SES = new SESClient({
    region: process.env.AWS_REGION,
})

export default SES;
