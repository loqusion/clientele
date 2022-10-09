export type Route = string

export type Method = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export enum HttpStatusCode {
  Continue = 100,
  SwitchingProtocols = 101,
  Processing = 102,
  EarlyHints = 103,
  Ok = 200,
  Created = 201,
  Accepted = 202,
  NonAuthoritativeInformation = 203,
  NoContent = 204,
  ResetContent = 205,
  PartialContent = 206,
  MultiStatus = 207,
  AlreadyReported = 208,
  ImUsed = 226,
  MultipleChoices = 300,
  MovedPermanently = 301,
  Found = 302,
  SeeOther = 303,
  NotModified = 304,
  UseProxy = 305,
  Unused = 306,
  TemporaryRedirect = 307,
  PermanentRedirect = 308,
  BadRequest = 400,
  Unauthorized = 401,
  PaymentRequired = 402,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  NotAcceptable = 406,
  ProxyAuthenticationRequired = 407,
  RequestTimeout = 408,
  Conflict = 409,
  Gone = 410,
  LengthRequired = 411,
  PreconditionFailed = 412,
  PayloadTooLarge = 413,
  UriTooLong = 414,
  UnsupportedMediaType = 415,
  RangeNotSatisfiable = 416,
  ExpectationFailed = 417,
  ImATeapot = 418,
  MisdirectedRequest = 421,
  UnprocessableEntity = 422,
  Locked = 423,
  FailedDependency = 424,
  TooEarly = 425,
  UpgradeRequired = 426,
  PreconditionRequired = 428,
  TooManyRequests = 429,
  RequestHeaderFieldsTooLarge = 431,
  UnavailableForLegalReasons = 451,
  InternalServerError = 500,
  NotImplemented = 501,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504,
  HttpVersionNotSupported = 505,
  VariantAlsoNegotiates = 506,
  InsufficientStorage = 507,
  LoopDetected = 508,
  NotExtended = 510,
  NetworkAuthenticationRequired = 511,
}

type HeaderValue = string | number | undefined
type AnyHeaders = Record<string, HeaderValue>

export type ClienteleRequestHeaders = {
  accept?: string
  authorization?: string
  'user-agent'?: string
} & AnyHeaders

export type ClienteleRequestConfig = {
  url?: string
  method?: Method
  baseUrl?: string
  headers?: ClienteleRequestHeaders
  request?: unknown
}

export type ClienteleDefaults = ClienteleRequestConfig

export type ClienteleRequestParameters = {
  [parameter: string]: unknown
}

export interface ClienteleRequestInterface<
  D extends ClienteleDefaults = ClienteleDefaults,
> {
  <T>(
    route: Route,
    params?: ClienteleRequestParameters,
    config?: ClienteleRequestConfig,
  ): Promise<ClienteleResponse<T>>

  create: <C extends ClienteleRequestConfig = ClienteleRequestConfig>(
    config?: C,
  ) => C extends { baseUrl: string }
    ? ClienteleRequestInstance<D & C>
    : ClienteleRequestInterface<D & C>

  defaults: D
}

export interface ClienteleRequestInstance<
  D extends ClienteleDefaults = ClienteleDefaults,
> extends ClienteleRequestInterface<D> {
  <T>(
    params: ClienteleRequestParameters,
    config?: ClienteleRequestConfig,
  ): Promise<ClienteleResponse<T>>
}

export type ClienteleResponseHeaders = {
  'cache-control'?: string
  'content-length'?: number
  'content-type'?: string
  date?: string
  etag?: string
  'last-modified'?: string
  link?: string
  location?: string
  server?: string
  status?: string
  vary?: string
  [header: string]: string | number | undefined
}

export type ClienteleResponse<T, S extends HttpStatusCode = HttpStatusCode> = {
  headers: ClienteleResponseHeaders
  status: S
  /** URL of response after all redirects */
  url: string
  /** Response data */
  data: T
}
