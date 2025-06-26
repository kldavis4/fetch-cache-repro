export default async function ReproPage(props: { params: Promise<{ id: string, bust: string }>}) {
  const { params } = props;
  const { id, bust } = await params;

  const cacheBust = (bust: string) => {
    if (bust === 'bust') {
      return `&__cb=${Math.random()}`
    } else {
      return ''
    }
  }
  const doTest = async (id: string): Promise<string[]> => {
    let logs: string[] = [];

    let res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/kv?id=${encodeURIComponent(id)}${cacheBust(bust)}`, {
      cache: 'no-store',
    })
    if (res.status === 404) {
      const newValue = { random: String(Math.random()), version: 0 };
      const putRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/kv`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: id, value: newValue }),
      });
      if (putRes.status === 200) {
        logs.push(`Seeded value with version ${newValue.version} - request success`);

        res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/kv?id=${encodeURIComponent(id)}${cacheBust(bust)}`, {
          cache: 'no-store',
        });

        if (res.status === 200) {
          logs.push(`Successfully seeded value: ${JSON.stringify(newValue)}`);
        } else {
          logs.push(`Failed to get seeded value - request failed ${res.status} - aborting`);
          return logs;
        }
      } else {
        logs.push(`Failed to seed value - request failed - aborting`);
        return logs;
      }
    } else if (res.status !== 200) {
      logs.push(`Failed to get initial value - request failed - aborting`);
      return logs;
    }

    const currentValue = await res.json();
    logs.push(`Current value: ${JSON.stringify(currentValue)}`);

    const newValue = { ...currentValue, version: (currentValue.version || 0) + 1 };
    const putRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/kv`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: id, value: newValue }),
    });
    if (putRes.status === 200) {
      logs.push(`Updated value to version ${newValue.version} - request success`);
    } else {
      logs.push(`Failed to update value - request failed - aborting`);
      return logs;
    }

    const updateCheckRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/kv?id=${encodeURIComponent(id)}${cacheBust(bust)}`, {
      cache: 'no-store',
    })
    const updatedValue = await updateCheckRes.json();
    if (updatedValue?.version === newValue.version) {
      logs.push(`Successfully updated value to version ${newValue.version}`);
    } else {
      logs.push(`Update check failed: expected version ${newValue.version}, got ${updatedValue?.version} - aborting`);
    }

    return logs;
  }

  const logs = await doTest(id);

  return (
    <main style={{ padding: 24 }}>
      <pre style={{ background: '#eee', padding: 16, borderRadius: 8 }}>
        {logs.join('\n')}
      </pre>
    </main>
  );
}