'use strict';

module.exports = {
  dotAccessorConfig: {
    separator: '**'
  },
  hcl: {
    aws: {
      default: {
        identifier: {
          action: 'value',
          targets: [
            'primary**attributes**arn',
            'primary**attributes**unique_id',
            'primary**attributes**id'
          ]
        },
        cloud_account_id: {
          action: 'regexp',
          targets: [
            'primary**attributes**arn',
            'primary**attributes**owner_id',
            'primary**attributes**execution_arn'
          ],
          regexp: '(?<=\\:)(\\d{12})(?=\\:)|\\d{12}$'
        },
        region: {
          action: 'search',
          targets: [
            'primary**attributes**region',
            'primary**attributes**arn'
          ]
        },
        resource_name: {
          action: 'regexps_key',
          targets: [
            'primary**attributes'
          ],
          regexps: [
            '^.*name.*$',
            '.*_name.*$',
            '^id$',
            '^bucket$'
          ]
        },
        resource_timestamp: {
          action: 'regexps_key',
          targets: [
            'primary**attributes'
          ],
          regexps: [
            '^.*creat.*dat.*$',
            '^.*update.*dat.*$',
            '^.*modif.*dat.*$'
          ]
        }
      }
    },
    google: {
      default: {
        identifier: {
          action: 'value',
          targets: [
            'primary**attributes**number',
            'primary**attributes**unique_id',
            'primary**attributes**instance_id',
            'primary**attributes**id'
          ]
        },
        cloud_account_id: {
          action: 'value',
          targets: [
            'primary**attributes**org_id',
            'primary**attributes**project',
            'primary**attributes**project_id'
          ]
        },
        region: {
          action: 'search',
          targets: [
            'primary**attributes**region'
          ]
        },
        resource_name: {
          action: 'regexps_key',
          targets: [
            'primary**attributes'
          ],
          regexps: [
            '.*name.*',
            '.*number.*',
            '.*id.*'
          ]
        },
        resource_timestamp: {
          action: 'regexps_key',
          targets: [
            'primary**attributes'
          ],
          regexps: [
            '^.*creat.*time.*$',
            '^.*update.*time.*$'
          ]
        }
      }
    },
    azurerm: {
      default: {
        identifier: {
          action: 'value',
          targets: [
            'primary**attributes**application_id',
            'primary**attributes**id'
          ]
        },
        cloud_account_id: {
          action: 'value',
          targets: [
            'primary**attributes**principal_id'
          ]
        },
        region: {
          action: 'regexp_key',
          targets: [
            'primary**attributes'
          ],
          regexp: '.*location.*'
        },
        resource_name: {
          action: 'regexps_key',
          targets: [
            'primary**attributes'
          ],
          regexps: [
            '.*id.*'
          ]
        },
        resource_timestamp: {
          action: 'regexps_key',
          targets: [
            'primary**attributes'
          ],
          regexps: [
            '^.*creat.*time.*$',
            '^.*update.*time.*$'
          ]
        }
      }
    },
    null: {
      default: {
        identifier: {
          action: 'value',
          targets: [
            'primary**attributes**id'
          ]
        },
        cloud_account_id: {
          action: 'none'
        },
        region: {
          action: 'none'
        },
        resource_name: {
          action: 'regexps_key',
          targets: [
            'primary**attributes'
          ],
          regexps: [
            '^.*name.*$',
            '.*_name.*$',
            '^id$',
            '^bucket$'
          ]
        },
        resource_timestamp: {
          action: 'regexps_key',
          targets: [
            'primary**attributes'
          ],
          regexps: [
            '^.*creat.*dat.*$',
            '^.*update.*dat.*$',
            '^.*modif.*dat.*$'
          ]
        }
      }
    }
  },
  hcl2: {
    aws: {
      default: {
        identifier: {
          action: 'value',
          targets: [
            'attributes**arn',
            'attributes**unique_id',
            'attributes**id'
          ]
        },
        cloud_account_id: {
          action: 'regexp',
          targets: [
            'attributes**arn',
            'attributes**owner_id',
            'attributes**execution_arn'
          ],
          regexp: '(?<=\\:)(\\d{12})(?=\\:)|\\d{12}$'
        },
        region: {
          action: 'search',
          targets: [
            'attributes**region',
            'attributes**arn'
          ]
        },
        resource_name: {
          action: 'regexps_key',
          targets: [
            'attributes'
          ],
          regexps: [
            '^.*name.*$',
            '.*_name.*$',
            '^id$',
            '^bucket$'
          ]
        },
        resource_timestamp: {
          action: 'regexps_key',
          targets: [
            'attributes'
          ],
          regexps: [
            '^.*creat.*dat.*$',
            '^.*update.*dat.*$',
            '^.*modif.*dat.*$'
          ]
        }
      }
    },
    google: {
      default: {
        identifier: {
          action: 'value',
          targets: [
            'attributes**number',
            'attributes**unique_id',
            'attributes**instance_id',
            'attributes**id'
          ]
        },
        cloud_account_id: {
          action: 'value',
          targets: [
            'attributes**org_id',
            'attributes**project',
            'attributes**project_id'
          ]
        },
        region: {
          action: 'search',
          targets: [
            'attributes**region'
          ]
        },
        resource_name: {
          action: 'regexps_key',
          targets: [
            'attributes'
          ],
          regexps: [
            '.*name.*',
            '.*number.*',
            '.*id.*'
          ]
        },
        resource_timestamp: {
          action: 'regexps_key',
          targets: [
            'attributes'
          ],
          regexps: [
            '^.*creat.*time.*$',
            '^.*update.*time.*$'
          ]
        }
      }
    },
    azurerm: {
      default: {
        identifier: {
          action: 'value',
          targets: [
            'attributes**application_id',
            'attributes**id'
          ]
        },
        cloud_account_id: {
          action: 'value',
          targets: [
            'attributes**principal_id'
          ]
        },
        region: {
          action: 'regexp_key',
          targets: [
            'attributes'
          ],
          regexp: '.*location.*'
        },
        resource_name: {
          action: 'regexps_key',
          targets: [
            'attributes'
          ],
          regexps: [
            '.*id.*'
          ]
        },
        resource_timestamp: {
          action: 'regexps_key',
          targets: [
            'attributes'
          ],
          regexps: [
            '^.*creat.*time.*$',
            '^.*update.*time.*$'
          ]
        }
      }
    },
    null: {
      default: {
        identifier: {
          action: 'value',
          targets: [
            'attributes**id'
          ]
        },
        cloud_account_id: {
          action: 'none'
        },
        region: {
          action: 'none'
        },
        resource_name: {
          action: 'regexps_key',
          targets: [
            'attributes'
          ],
          regexps: [
            '^.*name.*$',
            '.*_name.*$',
            '^id$',
            '^bucket$'
          ]
        },
        resource_timestamp: {
          action: 'regexps_key',
          targets: [
            'attributes'
          ],
          regexps: [
            '^.*creat.*dat.*$',
            '^.*update.*dat.*$',
            '^.*modif.*dat.*$'
          ]
        }
      }
    }
  },
  excludedDataSources: [
    'template_file',
    'template_cloudinit_config',
    'local_file',
    'aws_iam_policy_document',
    'terraform_remote_state'
  ]
};
