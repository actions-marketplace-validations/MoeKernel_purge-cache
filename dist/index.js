"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const github = __importStar(require("@actions/github"));
const core = __importStar(require("@actions/core"));
function setFailedWrongValue(input, value) {
    core.setFailed(`Wrong value for the input '${input}': ${value}`);
}
var Inputs;
(function (Inputs) {
    Inputs["Debug"] = "debug";
    Inputs["MaxAge"] = "max-age";
    Inputs["Accessed"] = "accessed";
    Inputs["Created"] = "created";
    Inputs["Token"] = "token";
    Inputs["CacheKey"] = "cache_key";
})(Inputs || (Inputs = {}));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const debug = core.getInput(Inputs.Debug, { required: false }) === 'true';
        const maxAge = core.getInput(Inputs.MaxAge, { required: true });
        const maxDate = new Date(Date.now() - Number.parseInt(maxAge) * 1000);
        if (maxDate === null) {
            setFailedWrongValue(Inputs.MaxAge, maxAge);
        }
        const accessed = core.getInput(Inputs.Accessed, { required: false }) === 'true';
        const created = core.getInput(Inputs.Created, { required: false }) === 'true';
        const token = core.getInput(Inputs.Token, { required: true });
        const cacheKey = core.getInput(Inputs.CacheKey, { required: false });
        const octokit = github.getOctokit(token);
        const results = [];
        for (let i = 1; i <= 100; i += 1) {
            const { data: cachesRequest } = yield octokit.rest.actions.getActionsCacheList({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                per_page: 100,
                page: i
            });
            if (cachesRequest.actions_caches.length == 0) {
                break;
            }
            results.push(...cachesRequest.actions_caches);
        }
        if (debug) {
            console.log(`Found ${results.length} caches`);
        }
        if (cacheKey) {
            const cacheToDelete = results.find(cache => cache.key === cacheKey);
            if (cacheToDelete && cacheToDelete.id !== undefined) {
                try {
                    yield octokit.rest.actions.deleteActionsCacheById({
                        owner: github.context.repo.owner,
                        repo: github.context.repo.repo,
                        cache_id: cacheToDelete.id,
                    });
                    core.info(`Cache with key ${cacheKey} deleted successfully.`);
                }
                catch (error) {
                    core.setFailed(`Failed to delete cache ${cacheKey};\n\n${error}`);
                }
            }
            else {
                core.warning(`No cache found with key ${cacheKey}.`);
            }
        }
        else {
            results.forEach((cache) => __awaiter(this, void 0, void 0, function* () {
                if (cache.last_accessed_at !== undefined && cache.created_at !== undefined && cache.id !== undefined) {
                    const accessedAt = new Date(cache.last_accessed_at);
                    const createdAt = new Date(cache.created_at);
                    const accessedCondition = accessed && accessedAt < maxDate;
                    const createdCondition = created && createdAt < maxDate;
                    if (accessedCondition || createdCondition) {
                        if (debug) {
                            if (accessedCondition) {
                                console.log(`Deleting cache ${cache.key}, last accessed at ${accessedAt} before ${maxDate}`);
                            }
                            if (createdCondition) {
                                console.log(`Deleting cache ${cache.key}, created at ${createdAt} before ${maxDate}`);
                            }
                        }
                        try {
                            yield octokit.rest.actions.deleteActionsCacheById({
                                owner: github.context.repo.owner,
                                repo: github.context.repo.repo,
                                cache_id: cache.id,
                            });
                        }
                        catch (error) {
                            console.log(`Failed to delete cache ${cache.key};\n\n${error}`);
                        }
                    }
                    else if (debug) {
                        if (accessed) {
                            console.log(`Skipping cache ${cache.key}, last accessed at ${accessedAt} after ${maxDate}`);
                        }
                        if (created) {
                            console.log(`Skipping cache ${cache.key}, created at ${createdAt} after ${maxDate}`);
                        }
                    }
                }
            }));
        }
    });
}
run();
