import { EventEmitter } from "events"
import HttpStatus from "http-status-codes"
import { stringify } from "query-string"

type Header = {
    name: string;
    value: string;
}

type RestClientOptions = {
    timeout?: number;
    headers?: Headers | Header[];
};

type RestRequestOptions = RestClientOptions;

type UrlParams = {
    [key: string]: string | number | Array<string | number>
}

type Response<T> = {
    statusCode: number;
    data: T
}

enum Method {
    Get = "GET",
    Post = "POST",
    Put = "PUT",
    Delete = "DELETE"
}

export default class RestClient {
    private _url: string;
    private _options?: RestClientOptions;
    private _eventEmitter: EventEmitter;

    constructor(url: string, options?: RestClientOptions) {
        this._url = url;
        this._options = options;
        this._eventEmitter = new EventEmitter();
    }

    public get<Params extends UrlParams = UrlParams, Result = object>(
        urn: string | string[],
        params?: Params,
        options?: RestRequestOptions
    ): Promise<Response<Result>> {
        return this._request(RestClient._getFormattedUrn(urn, params && stringify(params)), Method.Get)
    }

    public post<Result = any>(
        urn: string | string[],
        body?: Document | BodyInit | null,
        options?: RestRequestOptions
    ): Promise<Response<Result>> {
        return this._request(RestClient._getFormattedUrn(urn), Method.Post, body)
    }

    public put<Result = any>(
        urn: string | string[],
        body?: Document | BodyInit | null,
        options?: RestRequestOptions
    ): Promise<Response<Result>> {
        return this._request(RestClient._getFormattedUrn(urn), Method.Put, body)
    }

    public delete<Result = any>(
        urn: string | string[],
        body?: Document | BodyInit | null,
        options?: RestRequestOptions
    ) {
        return this._request(RestClient._getFormattedUrn(urn), Method.Delete, body);
    }

    private static _getFormattedUrn(urn: string | string[], queryString?: string): string {
        const path = urn instanceof Array ? urn.reduce((path: string, value: string) => `${path}/${value}`, "") : urn;
        return `${path}${queryString !== undefined ? `?${queryString}` : ""}`
    }

    private static _isSuccessStatus(xhr: XMLHttpRequest) {
        return [
            HttpStatus.OK,
            HttpStatus.CREATED,
            HttpStatus.ACCEPTED,
            HttpStatus.NON_AUTHORITATIVE_INFORMATION,
            HttpStatus.NO_CONTENT,
            HttpStatus.RESET_CONTENT,
            HttpStatus.PARTIAL_CONTENT,
            HttpStatus.MULTI_STATUS
        ].includes(xhr.status);
    }

    private static _setHeaders(xhr: XMLHttpRequest, options?: RestRequestOptions) {
        if (options?.headers) {
            const { headers } = options

            if (options.headers instanceof Headers) {
                ( headers as Headers ).forEach((value: string, key: string, parent: Headers): void => {
                    xhr.setRequestHeader(key, value);
                })
            } else {

            }
        }

        
    }

    private _request<Result>(urn: string, method: Method, body?: Document | BodyInit | null): Promise<Response<Result>> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            this._eventEmitter.emit('create', xhr);

            xhr.open(method, this._url + urn);
            xhr.setRequestHeader('Content-Type', 'application/json');

            if (this._options?.timeout) {
                xhr.timeout = this._options.timeout;
            }

            xhr.onreadystatechange = () => {
                if (xhr.readyState == XMLHttpRequest.DONE) {
                    console.log(xhr.responseText === '')
                    if (RestClient._isSuccessStatus(xhr)) {
                        try {
                            resolve({ statusCode: xhr.status, data: JSON.parse(xhr.responseText) as Result });
                        } catch (error) {
                            reject(error);
                        }
                    } else if (xhr.status) {
                        try {
                            reject(JSON.parse(xhr.responseText));
                        } catch (error) {
                            reject(error);
                        }
                    } else {
                        reject(new Error('An error ocurred whilst sending the request.'));
                    }
                }
            };

            xhr.send(body)
        })
    }

    private _getResponseData(xhr: XMLHttpRequest) {
        if (xhr.responseText === "") {
            return null;
        }


    }
}
