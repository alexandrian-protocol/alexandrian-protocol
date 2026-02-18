export class AlexandrianClient {
  constructor(private readonly baseUrl: string) {}

  ping(): string {
    return `ok:${this.baseUrl}`;
  }
}
