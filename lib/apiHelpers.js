export function jsonOk(data, init) {
  return Response.json({ ok: true, ...data }, init);
}

export function jsonError(message, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

/**
 * Converts a Mongoose document (or lean object) into a plain JSON-safe
 * object with `_id` as a string.
 */
export function serialize(doc) {
  if (!doc) return doc;
  const obj = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  if (obj._id) obj._id = obj._id.toString();
  if (obj.batchId) obj.batchId = obj.batchId.toString();
  return JSON.parse(JSON.stringify(obj));
}

export function serializeMany(docs) {
  return (docs || []).map(serialize);
}
