import mock from 'xhr-mock';
import RestClient from "../src/client";

describe('RestClient', () => {
    let client: RestClient;
    const host = 'http://example.com';
    beforeEach(() => {
        mock.setup()
        client = new RestClient(host);
    });

    afterEach(() => mock.teardown());

    it('get request', () => {
        expect.assertions(3);
        const path = "/api/user";

        mock.get(`${host}${path}/`, (req, res) => {
            expect(req.header('Content-Type')).toEqual('application/json');
            expect(req.url().query).toEqual({ test: "1" });
            return res.status(200).body('{"data":{"id":"abc-123"}}');
        });

        return client.get<{ test: number }, { data: { id: string } }>(path, { test: 1 }).then(({ data }) => expect(data).toEqual({ "data": { "id": "abc-123" } }));
    });

    it('post request', () => {
        expect.assertions(2);
        const path = "/api/user"

        mock.post(`${host}${path}`, (req, res) => {
            expect(req.header("Content-Type")).toEqual("application/json");
            expect(JSON.parse(req.body())).toEqual({ name: "test" });
            return res.status(201);
        })

        return client.post<{ status: boolean }>(path, JSON.stringify({ name: "test" }))
    })
});
