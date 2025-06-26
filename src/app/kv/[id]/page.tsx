import { notFound } from 'next/navigation';
import { fetchRequest } from '@/util/rpc';


interface KVPageProps {
  params: { id: string };
}

export default async function KVPage(props: any) {
  const { params } = props;
  const { id } = await params;
  let data = null;
  let error = null;
  try {
    // const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/kv?id=${encodeURIComponent(id)}`);
    const res = await fetchRequest({
      url: `api/kv?id=${encodeURIComponent(id)}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      baseURL: process.env.NEXT_PUBLIC_BASE_URL || '',
    }, false, true, true)
    console.log(res.status)
    if (res.status !== 200) {
      throw new Error('Not found');
    }
    data = res.data
    if (!data || data.value === undefined) {
      return notFound();
    }
  } catch (e) {
    return notFound();
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>KV Content for: {id}</h1>
      <pre style={{ background: '#eee', padding: 16, borderRadius: 8 }}>
        {JSON.stringify(data.value, null, 2)}
      </pre>
    </main>
  );
}
