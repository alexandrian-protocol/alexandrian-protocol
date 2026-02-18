export class DatasetClient {
  constructor(private readonly baseUrl: string) {}

  list(): string[] {
    return [this.baseUrl];
  }
}
