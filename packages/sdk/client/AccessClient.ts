export class AccessClient {
  constructor(private readonly baseUrl: string) {}

  check(subject: string): string {
    return `${this.baseUrl}:${subject}`;
  }
}
