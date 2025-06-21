import { Request, Response } from "express";
import transactionsService from "./transactions.service";
import { errorResponse, successResponse } from "../../utils/response";
import { GetTransactionsQuerySchema } from "./transactions.validators";

export async function getTransactions(
  req: Request<{}, {}, {}, GetTransactionsQuerySchema>,
  res: Response
) {
  try {
    const {
      sort = "desc",
      limit = "10",
      page = "1",
      search,
      status,
    } = req.query;

    const result = await transactionsService.getTransactions({
      sort: sort === "desc" ? -1 : 1,
      limit: parseInt(limit),
      page: parseInt(page),
      search,
      status,
    });

    res.send(successResponse("Transactions fetched successfully", result));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).send(errorResponse("Failed to fetch transactions"));
  }
}
