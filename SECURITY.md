# Security Policy

## Reporting a Vulnerability
**DO NOT CREATE AN ISSUE** to report a security problem. Instead, please send an email to security@terrahub.io

## Incident Response Process
In case an incident is discovered or reported, we will follow the following process to contain, respond and remediate:

### Contain
The first step is to find out the root cause, nature and scope of the incident.
* Is still ongoing? If yes, first priority is to stop it.
* Is the incident outside of our influence? If yes, first priority is to contain it.
* Find out who knows about the incident and who is affected.
* Find out what data was potentially exposed.

### Respond
After the initial assessment and containment to our best abilities, we will document all actions taken in a response plan.

We will create a new release with comments to inform users about the incident and what actions were taken to contain it.

### Remediate
Once the incident is confirmed to be resolved, we will summarize the lessons learned from the incident and create a list of actions we will take to prevent it from happening again.


## Vulnerability Management Plan

### Keep permissions to a minimum
The TerraHub CLI uses the least amount of access to limit the impact of possible security incidents.

### Secure accounts with access
The [TerraHub Organization](https://github.com/TerraHubCorp) on GitHub requires 2FA authorization for all members.

### Critical Updates and Security Notices
We learn about critical software updates and security threats from these sources:
* [GitHub Security Alerts](https://docs.github.com/en/github/managing-security-vulnerabilities/about-alerts-for-vulnerable-dependencies)
* [Snyk's Vulnerability DB](https://snyk.io/vuln)
* [Node.js Security Working Group](https://github.com/nodejs/security-wg)
