# purge-cache

This action allows the cache of GitHub Actions to be automatically purged

## Basic usage

See [action.yml](action.yml)

## Changes in v3
```yaml
steps:
- uses: MoeKernel/purge-cache@v3
  with:
    cache_key: 'CacheKey'
```

## Changes in v2
```yaml
steps:
- uses: MoeKernel/purge-cache@v2
  with:
    accessed: true
    created: false
    max-age: 604800
```

### Some Things
- ``debug``: true # **Set to true to output debug info**
- ``token``: $GITHUBTOKEN # **Set a GitHub token**
- ``accessed``: true # **Purge caches by their last accessed time (default)**
- ``created``: false # **Purge caches by their created time (default)**
- ``max-age``: 604800 # **Leave only caches accessed in the last 7 days (default)**
- ``cache_key``: 'YourCacheKeyName' **# define the keyname created in your cache/github-actions**

## Example workflow

See [ci.yaml](.github/workflows/ci.yaml)

## Other options

### Debug

Output debug data (defaults to `false`)

- Number of caches
- Skipped caches
- Deleted caches

```yaml
steps:
- uses: Moekernel/purge-cache@v2
  with:
    debug: true
```

### Token
Set a GitHub token, will default to `${github.token}`. This will probably not be nessesary as the default token should be sufficient. 

In case custom `permissions` are set for the tokens used in your actions workflow, to purge existing caches, the permission:
```
actions: write
```
needs to be available for the token. 

```yaml
steps:
- uses: MoeKernel/purge-cache@v2
  with:
    token: $GITHUBTOKEN
```
