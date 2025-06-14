export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}

export function extractAvailableFields(data: any, prefix: string = ''): string[] {
  if (!data || typeof data !== 'object') return [];

  const fields: string[] = [];

  Object.keys(data).forEach(key => {
    const fieldPath = prefix ? `${prefix}.${key}` : key;
    fields.push(fieldPath);

    if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
      const nestedFields = extractAvailableFields(data[key], fieldPath);
      fields.push(...nestedFields);
    }
  });

  return fields;
}

export function generateSampleData(): any {
  return {
    id: 1,
    name: "John Silva",
    email: "john@example.com",
    age: 30,
    active: true,
    profile: {
      department: "IT",
      role: "Developer",
      salary: 5000
    },
    skills: ["JavaScript", "Angular", "Node.js"],
    metadata: {
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-20T14:45:00Z"
    }
  };
}

export function getTableColumns(data: any): string[] {
  if (!data) return [];

  if (Array.isArray(data) && data.length > 0) {
    return Object.keys(data[0]);
  } else if (typeof data === 'object') {
    return Object.keys(data);
  }

  return [];
}

export function getTableRows(data: any): any[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data;
  } else if (typeof data === 'object') {
    return [data];
  }

  return [];
}

export function getNodeConnections(editor: any): any[] {
  if (!editor) return [];

  const exportData = editor.export();
  const nodes = exportData.drawflow.Home.data;
  const connections: any[] = [];

  Object.keys(nodes).forEach(nodeId => {
    const node = nodes[nodeId];
    Object.keys(node.outputs || {}).forEach(outputKey => {
      const output = node.outputs[outputKey];
      Object.keys(output.connections || {}).forEach(connectionKey => {
        const connection = output.connections[connectionKey];
        connections.push({
          sourceNode: nodeId,
          targetNode: connection.node,
          sourceOutput: outputKey,
          targetInput: connection.output
        });
      });
    });
  });

  return connections;
} 