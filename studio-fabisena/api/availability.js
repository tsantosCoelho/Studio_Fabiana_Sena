export default async function handler(req, res) {

    if (req.method !== "GET") {

        return res.status(405).json({
            success: false,
            message: "Método não permitido."
        });
    }


    const date =
        typeof req.query.date === "string"
            ? req.query.date.trim()
            : "";


    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {

        return res.status(400).json({
            success: false,
            message: "Data inválida."
        });
    }


    const backendUrl =
        process.env.APPS_SCRIPT_URL;

    const backendToken =
        process.env.BACKEND_TOKEN;


    if (
        !backendUrl ||
        !backendToken
    ) {

        console.error(
            "APPS_SCRIPT_URL ou BACKEND_TOKEN não configurado."
        );

        return res.status(500).json({
            success: false,
            message: "Erro interno."
        });
    }


    try {

        /*
         * Timestamp para impedir cache.
         */

        const url =
            `${backendUrl}` +
            `?action=availability` +
            `&date=${encodeURIComponent(date)}` +
            `&token=${encodeURIComponent(backendToken)}` +
            `&_=${Date.now()}`;


        console.log(
            "Consultando disponibilidade:",
            date
        );


        const response =
            await fetch(
                url,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json",

                        "Cache-Control":
                            "no-cache"
                    },

                    cache: "no-store"
                }
            );


        const responseText =
            await response.text();


        console.log(
            "Resposta da disponibilidade:",
            response.status,
            responseText
        );


        let data;


        try {

            data =
                JSON.parse(
                    responseText
                );

        } catch (error) {

            console.error(
                "Resposta inválida do Apps Script:",
                responseText
            );

            return res.status(502).json({
                success: false,
                message:
                    "O sistema de disponibilidade retornou uma resposta inválida."
            });
        }


        if (
            !response.ok ||
            data.success === false
        ) {

            console.error(
                "Erro na disponibilidade:",
                data
            );

            return res.status(502).json({
                success: false,
                message:
                    data.message ||
                    "Não foi possível consultar os horários."
            });
        }


        /*
         * Headers anti-cache.
         */

        res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate"
        );

        res.setHeader(
            "Pragma",
            "no-cache"
        );

        res.setHeader(
            "Expires",
            "0"
        );


        return res.status(200).json({

            success: true,

            occupied:
                Array.isArray(
                    data.occupied
                )
                    ? data.occupied
                    : []

        });


    } catch (error) {

        console.error(
            "Erro ao consultar disponibilidade:",
            error
        );


        return res.status(502).json({
            success: false,
            message:
                "Não foi possível consultar os horários."
        });
    }
}
