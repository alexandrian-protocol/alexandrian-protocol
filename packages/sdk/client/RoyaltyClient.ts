export class RoyaltyClient {
  constructor(private readonly baseUrl: string) {}

  list(): string[] {
    return [this.baseUrl];
  }
}
