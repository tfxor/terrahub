'use strict';

const AWS = require('aws-sdk');

const cloudfront = new AWS.CloudFront();
const { THUB_S3_BUCKET_NAME: bucketName } = process.env;

/**
 * Get all Cloudfront distributions
 * @returns {Promise<{id: String, domainName: String, alias: []}[]>}
 */
function getDistributions() {
  console.log('INFO: Checking if CloudFront distributions exist');

  let marker;
  const result = [];
  const commonParams = { MaxItems: '10' };

  return new Promise(resolve => {
    const listDistributions = () => {
      const params = marker ? Object.assign(commonParams, { Marker: marker }) : commonParams;
      let isTruncated, items;

      cloudfront.listDistributions(params).promise().then(data => {
        const distributionList = data.DistributionList;

        ({ NextMarker: marker, IsTruncated: isTruncated, Items: items } = distributionList);

        items.map(distribution => {
          distribution.Origins.Items.map(origin => {
            result.push({ id: distribution.Id, domainName: origin.DomainName, alias: distribution.Aliases.Items });
          });
        });

        if (isTruncated) {
          listDistributions();
        }

        resolve(result);
      });
    };
    listDistributions();
  });
}

/**
 * @param {String} id
 * @returns {Promise<{message: String, data: Object}>}
 */
async function invalidateCloudfront(id) {
  const params = {
    DistributionId: id,
    InvalidationBatch: {
      CallerReference: Date.now().toString(),
      Paths: {
        Quantity: 1,
        Items: ['/*']
      }
    }
  };

  try {
    const res = await cloudfront.createInvalidation(params).promise();
    const data = res.$response.data.Invalidation;
    return {
      message: `Invalidation was created successfully for ${id}`,
      data: {
        invalidationId: data.Id,
        status: data.Status,
        createTime: data.CreateTime
      }
    };
  } catch (err) {
    return new Error(err);
  }
}

getDistributions().then(distributions => {
  const filtered = [];

  distributions.map(distribution => {
    if (distribution.domainName.includes(bucketName) || distribution.alias.includes(bucketName)) {
      filtered.push(distribution);
    }
  });

  if (!filtered.length) {
    console.error('ERROR: No CloudFront distributions were found... Aborting');
    process.exit(1);
  }

  filtered.map(distribution => {
    invalidateCloudfront(distribution.id).then(result => {
      console.log(result.message);
      console.log(JSON.stringify(result.data));
    });
  });
});
