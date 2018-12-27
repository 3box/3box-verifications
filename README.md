[![Twitter Follow](https://img.shields.io/twitter/follow/3boxdb.svg?style=for-the-badge&label=Twitter)](https://twitter.com/3boxdb)
[![Discord](https://img.shields.io/discord/484729862368526356.svg?style=for-the-badge)](https://discordapp.com/invite/Z3f3Cxy)


# 3Box Verification service

# Overview

This service allows to associate a service handle (twitter, github, etc) to a [did](https://w3c-ccg.github.io/did-spec/). It outputs a [did-jwt](https://github.com/uport-project/did-jwt) claim containing a link that serves as proof that the service handle is linked to the did.


# API

## Get DID document

This enables us to use have the issuer DID `did:https:verifications.3box.io` in the claims we create.

`GET /.well-known/did.json`

## Response data

    {
      "@context": "[https://w3id.org/did/v1](https://w3id.org/did/v1)",
      "id": "did:https:verifications.3box.io",
      "publicKey": [{
        "id": "did:https:verifications.3box.io#owner",
        "type": "Secp256k1VerificationKey2018",
        "owner": "did:https:verifications.3box.io",
        "ethereumAddress": "<ethereum address of private key>"
      }],
      "authentication": [{
        "type": "Secp256k1SignatureAuthentication2018",
        "publicKey": "did:https:verifications.3box.io#owner"
      }]
    }

## Create twitter verification

`POST /twitter`

## Body

    {
      did: <the DID of the user>,
      twitter_handle: <the twitter handle of the user>
    }

## Response

The response data follows the `[jsend](https://labs.omniti.com/labs/jsend)` standard.

## Response data

    {
      status: 'success',
      data: {
        verification: <verification-claim>
      }
    }

**Verification claim format**

    {
      iss: 'did:https:verifications.3box.io',
      sub: <did of the user>,
      iat: <current timestamp in seconds>,
      claim: {
        twitter_handle: <twitter handle of user>,
        twitter_proof: <url of tweet containing users DID>
      }
    }

