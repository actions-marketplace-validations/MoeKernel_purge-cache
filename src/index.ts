import * as github from '@actions/github';
import * as core from '@actions/core';

function setFailedWrongValue(input: string, value: string) {
  core.setFailed(`Valor incorreto para o input '${input}': ${value}`);
}

enum Inputs {
  Debug = "debug",
  MaxAge = "max-age",
  Accessed = "accessed",
  Created = "created",
  Token = "token",
  CacheKey = "cache-key"
}

async function run() {
  const debug = core.getInput(Inputs.Debug, { required: false }) === 'true';
  const maxAge = core.getInput(Inputs.MaxAge, { required: true });
  const maxDate = new Date(Date.now() - Number.parseInt(maxAge) * 1000);
  if (isNaN(maxDate.getTime())) {
    setFailedWrongValue(Inputs.MaxAge, maxAge);
    return;
  }
  const accessed = core.getInput(Inputs.Accessed, { required: false }) === 'true';
  const created = core.getInput(Inputs.Created, { required: false }) === 'true';
  const token = core.getInput(Inputs.Token, { required: true });
  const cacheKey = core.getInput(Inputs.CacheKey, { required: false });
  console.log(`Valor do cache_key: ${cacheKey}`);
  const octokit = github.getOctokit(token);

  interface Cache {
    id?: number | undefined;
    ref?: string | undefined;
    key?: string | undefined;
    version?: string | undefined;
    last_accessed_at?: string | undefined;
    created_at?: string | undefined;
    size_in_bytes?: number | undefined;
  }

  const results: Cache[] = [];

  for (let i = 1; i <= 100; i += 1) {
    const { data: cachesRequest } = await octokit.rest.actions.getActionsCacheList({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      per_page: 100,
      page: i
    });

    if (cachesRequest.actions_caches.length == 0) {
      break;
    }

    results.push(...cachesRequest.actions_caches);

    for (const cache of cachesRequest.actions_caches) {
      if (cache.key === cacheKey) {
        if (cache.last_accessed_at !== undefined && cache.created_at !== undefined && cache.id !== undefined) {
          const accessedAt = new Date(cache.last_accessed_at);
          const createdAt = new Date(cache.created_at);
          const accessedCondition = accessed && accessedAt < maxDate;
          const createdCondition = created && createdAt < maxDate;
          if (accessedCondition || createdCondition) {
            if (debug) {
              if (accessedCondition) {
                console.log(`Deletando cache ${cache.key}, último acesso em ${accessedAt} antes de ${maxDate}`);
              }
              if (createdCondition) {
                console.log(`Deletando cache ${cache.key}, criado em ${createdAt} antes de ${maxDate}`);
              }
            }

            try {
              await octokit.rest.actions.deleteActionsCacheById({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                cache_id: cache.id,
              });
              if (debug) {
                console.log(`Cache ${cache.key} deletado com sucesso.`);
              }
              return;
            } catch (error) {
              console.log(`Falha ao deletar o cache ${cache.key};\n\n${error}`);
            }
          } else if (debug) {
            if (accessed) {
              console.log(`Ignorando cache ${cache.key}, último acesso em ${accessedAt} após ${maxDate}`);
            }
            if (created) {
              console.log(`Ignorando cache ${cache.key}, criado em ${createdAt} após ${maxDate}`);
            }
          }
        }
      } else if (debug) {
        console.log(`Ignorando cache ${cache.key} porque não corresponde ao cache_key fornecido`);
      }
    }
  }

  if (debug) {
    console.log(`Cache com a chave ${cacheKey} não encontrado.`);
  }
}

run();
