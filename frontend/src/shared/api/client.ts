export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(
  /\/$/,
  '',
)

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Não foi possível conectar à API. Confira se o backend está em execução.')
  }
  const data = await response.json()
  if (!response.ok) {
    const details = data.error?.details
      ?.map(
        (item: { field: string; message: string }) =>
          `${item.field.replace('body.', '')}: ${item.message}`,
      )
      .join(' · ')
    throw new ApiError(
      response.status,
      details || data.error?.message || 'Não foi possível concluir a operação.',
    )
  }
  return data as T
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}
